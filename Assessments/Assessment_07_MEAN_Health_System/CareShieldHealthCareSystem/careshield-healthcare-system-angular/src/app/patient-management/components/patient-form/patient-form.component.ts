import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';
import { US_STATES } from '../../../shared/constants';
import { Gender } from '../../../shared/enums';
import { MaskedInputDirective } from '../../../shared/directives/masked-input.directive';
import { Hospital } from '../../../hospital-management/models/hospital.model';
import { HospitalService } from '../../../hospital-management/services/hospital.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MaskedInputDirective],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientFormComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  // Inject both PatientService and HospitalService
  constructor(
    private patientService: PatientService,
    private hospitalService: HospitalService,
    private router: Router
  ) {
    this.initializePatientFromRouterState();
  }

  // --- Component State Signals ---
  patients = signal<Patient[]>([]);
  hospitals = signal<Hospital[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');
  isUpdateMode = signal(false);
  formSubmitted = signal(false);

  // --- Constants and Enums ---
  usStates = US_STATES;
  genders = Object.values(Gender);

  // --- Patient Data Signal (Initial/Default State) ---
  newPatient = signal<Patient>({
    username: '',
    password: '',
    email: '',
    name: '',
    age: 0,
    profession: '',
    contact_number: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    gender: '' as Gender, // Cast to ensure type safety with enum
    pre_existing_disease: [],
    role: 'patient',
    hospital: []
  });

  // --- Initialization Logic ---

  /**
   * Initializes the patient form data and update mode from router state during navigation (for editing).
   */
  private initializePatientFromRouterState(): void {
    const patientFromState = this.router.getCurrentNavigation()?.extras.state?.['patient'];

    if (patientFromState) {
      // 1. Extract and transform data for signal
      const hospitalIds = patientFromState.hospital.map((h: Hospital) => h._id) || [];
      const diseaseArray = Array.isArray(patientFromState.pre_existing_disease)
        ? patientFromState.pre_existing_disease
        : [];

      // 2. Set the state for update mode
      this.isUpdateMode.set(true);

      this.newPatient.set({
        ...patientFromState,
        // SECURITY: NEVER pre-fill the password field during update.
        // Force it to be an empty string. The user will only submit a new password
        // if they intentionally type one.
        password: '',

        pre_existing_disease: diseaseArray,
        hospital: hospitalIds
      });
    }
  }

  // --- Computed Validation Properties ---

  // NOTE: isPasswordValid is only required when NOT in update mode.
  isUserNameValid = computed(() => this.newPatient().username.length > 0);
  isPasswordValid = computed(() => {
    // Password is required for ADD mode, but optional for UPDATE mode
    if (this.isUpdateMode()) {
      return true; // Optional password input is considered valid in update mode
    }
    return this.newPatient().password.length > 0; // Required in create mode
  });
  isEmailValid = computed(() => this.newPatient().email.length > 0);
  isNameValid = computed(() => this.newPatient().name.length > 0);
  isAgeValid = computed(() => this.newPatient().age > 0);
  isStreetValid = computed(() => this.newPatient().address.street.length > 0);
  isCityValid = computed(() => this.newPatient().address.city.length > 0);
  isStateValid = computed(() => this.newPatient().address.state.length > 0);
  isZipCodeValid = computed(() => this.newPatient().address.zipCode.length > 0);
  isZipCodeFiveDigits = computed(() => {
    const zipCodeRegex = /^\d{5}$/;
    return zipCodeRegex.test(this.newPatient().address.zipCode);
  });
  isCountryValid = computed(() => this.newPatient().address.country.length > 0);
  isGenderValid = computed(() => Object.values(Gender).includes(this.newPatient().gender as Gender));
  isPhoneValid = computed(() => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(this.newPatient().contact_number);
  });

  isFormValid = computed(() => {
    // Only check password validity based on mode
    const passwordCheck = this.isUpdateMode() ? true : this.isPasswordValid();

    return (
      this.isUserNameValid() &&
      passwordCheck &&
      this.isEmailValid() &&
      this.isNameValid() &&
      this.isAgeValid() &&
      this.isStreetValid() &&
      this.isCityValid() &&
      this.isStateValid() &&
      this.isZipCodeValid() &&
      this.isZipCodeFiveDigits() &&
      this.isCountryValid() &&
      this.isPhoneValid() &&
      this.isGenderValid()
    );
  });

  // --- Lifecycle Hooks ---

  ngOnInit() {
    this.fetchPatients();
    this.fetchHospitals();
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  // --- Event Handlers and Helpers ---

  fetchPatients() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    const sub = this.patientService.getPatients().subscribe({
      next: (data) => {
        this.patients.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message);
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  fetchHospitals() {
    this.hospitalService.getHospitals().then(
      (data) => {
        // Ensure that hospital IDs are strings
        this.hospitals.set(data.filter(h => h._id));
      }).catch((err) => {
      console.error('Error fetching hospitals:', err);
    });
  }

  updateField(fieldName: keyof Patient, event: any) {
    this.newPatient.update(p => ({
      ...p,
      [fieldName]: event
    }));
  }

  updateAddressField(fieldName: keyof Patient['address'], event: any) {
    this.newPatient.update(p => ({
      ...p,
      address: {
        ...p.address,
        [fieldName]: event
      }
    }));
  }

  // Method to handle adding/removing hospital IDs
  onHospitalSelection(event: Event, hospitalId: string) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.newPatient.update(p => {
      const hospitalArray = Array.isArray(p.hospital) ? [...p.hospital] : []; // Ensure it's an array
      if (isChecked) {
        if (!hospitalArray.includes(hospitalId)) {
          hospitalArray.push(hospitalId);
        }
      } else {
        const index = hospitalArray.indexOf(hospitalId);
        if (index > -1) {
          hospitalArray.splice(index, 1);
        }
      }
      return { ...p, hospital: hospitalArray };
    });
  }

  // Method to handle pre-existing disease input
  updatePreExistingDiseaseField(event: string) {
    const diseases = event.split(',').map(disease => disease.trim()).filter(disease => disease !== '');
    this.newPatient.update(p => ({
      ...p,
      pre_existing_disease: diseases
    }));
  }

  // --- Submission Logic ---

  submitPatient() {
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.error.set(true);
      this.message.set('Please correct the validation errors in the form.');
      return;
    }
    this.loading.set(true); // Start loading state before API call

    if (this.isUpdateMode()) {
      this.updatePatient();
    } else {
      this.addPatient();
    }
  }

  addPatient() {
    this.error.set(false);
    this.message.set('');

    const sub = this.patientService.createPatient(this.newPatient()).subscribe({
      next: (createdPatient) => {
        this.patients.update(patients => [...patients, createdPatient]);
        this.message.set('Patient created successfully!!');
        this.loading.set(false);
        this.router.navigate(['/patient-management']);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  updatePatient() {
    this.error.set(false);
    this.message.set('');

    // ➡️ Cast to a less strict type (e.g., any, or better, the new UpdatePatientPayload)
    let patientToUpdate: any = { ...this.newPatient() };

    // CRITICAL LOGIC: If the password field is empty, delete it from the payload.
    // The 'delete' operator is now allowed because the property type is 'any' or optional.
    if (patientToUpdate.password === '') {
      delete patientToUpdate.password;
    }

    // ➡️ Ensure the patient service expects an object that can omit the password.
    const sub = this.patientService.updatePatient(patientToUpdate).subscribe({
      next: () => {
        this.message.set('Patient successfully updated!');
        this.loading.set(false);
        this.router.navigate(['/patient-management']);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  cancelUpdate() {
    this.isUpdateMode.set(false);
    this.router.navigate(['/patient-management']);
  }
}

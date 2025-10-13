import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Doctor } from '../../models/doctor.model';
import { DoctorService } from '../../services/doctor.service';
import { US_STATES } from '../../../shared/constants';
import { Gender } from '../../../shared/enums';
import { Specialty } from '../../../shared/enums/specialty.enum';
import { MaskedInputDirective } from '../../../shared/directives/masked-input.directive';
import { Hospital } from '../../../hospital-management/models/hospital.model';
import { HospitalService } from '../../../hospital-management/services/hospital.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-doctor-form',
  imports: [CommonModule, FormsModule, MaskedInputDirective],
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorFormComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  // Inject both PatientService and HospitalService
  constructor(
    private doctorService: DoctorService,
    private hospitalService: HospitalService,
    private router: Router
  ) {
    this.initializeDoctorFromRouterState();
  }

  // --- Component State Signals ---
  doctors = signal<Doctor[]>([]);
  hospitals = signal<Hospital[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');
  isUpdateMode = signal(false);
  formSubmitted = signal(false);

  // --- Constants and Enums ---
  usStates = US_STATES;
  specialties = Object.values(Specialty);
  genders = Object.values(Gender);

  // --- Doctor Data Signal (Initial/Default State) ---
  newDoctor = signal<Doctor>({
    username: '',
    password: '',
    email: '',
    name: '',
    age: 0,
    contact_number: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    gender: '' as Gender, // Cast to ensure type safety with enum
    specialty: '' as Specialty,
    experience: 0,
    fees: 0,
    role: 'doctor',
    hospital: []
  });

  // --- Initialization Logic ---

  /**
   * Initializes the doctor form data and update mode from router state during navigation (for editing).
   */
  private initializeDoctorFromRouterState(): void {
    const doctorFromState = this.router.getCurrentNavigation()?.extras.state?.['doctor'];

    if (doctorFromState) {
      // 1. Extract and transform data for signal
      const hospitalIds = doctorFromState.hospital.map((h: Hospital) => h._id) || [];

      // 2. Set the state for update mode
      this.isUpdateMode.set(true);

      this.newDoctor.set({
        ...doctorFromState,
        // SECURITY: NEVER pre-fill the password field during update.
        // Force it to be an empty string. The patient will only submit a new password
        // if they intentionally type one.
        password: '',

        hospital: hospitalIds
      });
    }
  }

  // --- Computed Validation Properties ---

  // NOTE: isPasswordValid is only required when NOT in update mode.
  isUserNameValid = computed(() => this.newDoctor().username.length > 0);
  isPasswordValid = computed(() => {
    // Password is required for ADD mode, but optional for UPDATE mode
    if (this.isUpdateMode()) {
      return true; // Optional password input is considered valid in update mode
    }
    return this.newDoctor().password.length > 0; // Required in create mode
  });
  isEmailValid = computed(() => this.newDoctor().email.length > 0);
  isNameValid = computed(() => this.newDoctor().name.length > 0);
  isAgeValid = computed(() => this.newDoctor().age > 0);
  isStreetValid = computed(() => this.newDoctor().address.street.length > 0);
  isCityValid = computed(() => this.newDoctor().address.city.length > 0);
  isStateValid = computed(() => this.newDoctor().address.state.length > 0);
  isZipCodeValid = computed(() => this.newDoctor().address.zipCode.length > 0);
  isZipCodeFiveDigits = computed(() => {
    const zipCodeRegex = /^\d{5}$/;
    return zipCodeRegex.test(this.newDoctor().address.zipCode);
  });
  isCountryValid = computed(() => this.newDoctor().address.country.length > 0);
  isGenderValid = computed(() => Object.values(Gender).includes(this.newDoctor().gender as Gender));
  isPhoneValid = computed(() => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(this.newDoctor().contact_number);
  });
  isSpecialtyValid = computed(() => Object.values(Specialty).includes(this.newDoctor().specialty as Specialty));
  isExperienceValid = computed(() => this.newDoctor().experience >= 0);
  areFeesValid = computed(() => this.newDoctor().fees > 0);

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
      this.isGenderValid() &&
      this.isSpecialtyValid() &&
      this.isExperienceValid() &&
      this.areFeesValid()
    );
  });

  // --- Lifecycle Hooks ---

  ngOnInit() {
    this.fetchDoctors();
    this.fetchHospitals();
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  fetchDoctors() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    const sub = this.doctorService.getDoctors().subscribe({
      next: (data) => {
        this.doctors.set(data);
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

  updateField(fieldName: keyof Doctor, event: any) {
    this.newDoctor.update(p => ({
      ...p,
      [fieldName]: event
    }));
  }

  updateAddressField(fieldName: keyof Doctor['address'], event: any) {
    this.newDoctor.update(p => ({
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
    this.newDoctor.update(p => {
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

  // --- Submission Logic ---

  submitDoctor() {
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.error.set(true);
      this.message.set('Please correct the validation errors in the form.');
      return;
    }
    this.loading.set(true); // Start loading state before API call

    if (this.isUpdateMode()) {
      this.updateDoctor();
    } else {
      this.addDoctor();
    }
  }

  addDoctor() {
    this.error.set(false);
    this.message.set('');

    const sub = this.doctorService.createDoctor(this.newDoctor()).subscribe({
      next: (createdDoctor) => {
        this.doctors.update(doctors => [...doctors, createdDoctor]);
        this.message.set('Doctor created successfully!!');
        this.loading.set(false);
        this.router.navigate(['/doctor-management']);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  updateDoctor() {
    this.error.set(false);
    this.message.set('');

    // ➡️ Cast to a less strict type (e.g., any, or better, the new UpdatePatientPayload)
    let doctorToUpdate: any = { ...this.newDoctor() };

    // CRITICAL LOGIC: If the password field is empty, delete it from the payload.
    // The 'delete' operator is now allowed because the property type is 'any' or optional.
    if (doctorToUpdate.password === '') {
      delete doctorToUpdate.password;
    }

    // ➡️ Ensure the patient service expects an object that can omit the password.
    const sub = this.doctorService.updateDoctor(doctorToUpdate).subscribe({
      next: () => {
        this.message.set('Doctor successfully updated!');
        this.loading.set(false);
        this.router.navigate(['/doctor-management']);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel() {
    this.isUpdateMode.set(false);
    this.router.navigate(['/doctor-management']);
  }

}

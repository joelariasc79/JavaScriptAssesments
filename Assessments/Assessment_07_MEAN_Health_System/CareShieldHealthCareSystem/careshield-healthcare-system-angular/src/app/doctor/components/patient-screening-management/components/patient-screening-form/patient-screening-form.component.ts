import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { PatientScreeningModel, PatientScreeningDTO } from '../../models/patient-screening.model';
import { MedicationModel } from '../../models/medication.model';
import { SymptomDuration, ScreeningStatus, SYMPTOM_DURATION_OPTIONS } from '../../models/enums';
import { Disease } from '../../../../../disease-management/models/disease.model';
import { Patient } from '../../../../../patient-management/models/patient.model';

import { AuthService } from '../../../../../auth/services/auth.service';
import { DiseaseService } from '../../../../../disease-management/services/disease.service';
import { PatientScreeningService } from '../../services/patient-screening.service';


const DEFAULT_PATIENT: Patient = {
  username: '',
  email: '',
  password: '',
  name: '',
  age: 0,
  profession: '',
  contact_number: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  gender: '',
  pre_existing_disease: [],
  role: 'patient',
  hospital: [],
}

const MINIMAL_DEFAULT_DISEASE: Disease = {
  _id: '',
  name: '',
  specialty: { _id: '', name: '', description: '' } as any,
  treatmentProcedures: [],
};


@Component({
  selector: 'app-patient-screening-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-screening-form.component.html',
  styleUrl: './patient-screening-form.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientScreeningFormComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();

  public SYMPTOM_DURATION_OPTIONS = SYMPTOM_DURATION_OPTIONS;

  constructor(
    private patientScreeningService: PatientScreeningService,
    // private diseaseService: DiseaseService,
    private authService: AuthService, // Inject AuthService to get current user ID
    private router: Router
  ) {
    this.initializePatientScreeningFromRouterState();
  }

  // --- Component State Signals ---
  // patientScreening array is removed as it's not strictly needed in a form component
  // diseases = signal<Disease[]>([]);
  currentMedicationsInput = signal<string>('');
  loading = signal(false);
  error = signal(false);
  message = signal('');
  isUpdateMode = signal(false);
  formSubmitted = signal(false);


  // --- Patient Screening Data Signal (Initial/Default State) ---
  newPatientScreening = signal<PatientScreeningModel>({
    _id: '',
    patientId: DEFAULT_PATIENT,
    // selectedDisease: MINIMAL_DEFAULT_DISEASE,
    selectedDisease: null,
    appointmentId: null,
    chiefComplaint: '',
    symptomDescription: '',
    duration: '' as SymptomDuration,
    currentMedications: [],
    painLevel: 0,
    screeningStatus: ScreeningStatus.submitted,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // --- Initialization Logic ---

  /**
   * Initializes the Patient Screening form data and update mode from router state during navigation (for editing).
   */
  private initializePatientScreeningFromRouterState(): void {
    const patientScreeningFromState: PatientScreeningModel = this.router.getCurrentNavigation()?.extras.state?.['patientScreening'];

    if (patientScreeningFromState) {
      this.isUpdateMode.set(true);
      this.newPatientScreening.set(patientScreeningFromState);

      const medicationNames = patientScreeningFromState.currentMedications
        .map((m: MedicationModel) => m.name)
        .join(', ');
      this.currentMedicationsInput.set(medicationNames);

      if (typeof patientScreeningFromState.duration === 'string') {
        this.newPatientScreening.update(p => ({
          ...p,
          duration: patientScreeningFromState.duration as SymptomDuration
        }));
      }
    }
  }


  // --- Computed Validation Properties ---

  // isSelectedDiseaseValid = computed(() => !!this.newPatientScreening().selectedDisease?._id);
  isChiefComplaintValid = computed(() => this.newPatientScreening().chiefComplaint.length > 0);
  isSymptomDescriptionValid = computed(() => this.newPatientScreening().symptomDescription.length > 0);
  isSymptomDurationValid = computed(() =>
    SYMPTOM_DURATION_OPTIONS.includes(this.newPatientScreening().duration)
  );
  isCurrentMedicationsValid = computed(() => this.currentMedicationsInput().trim().length > 0);
  isPainLevelValid = computed(() => this.newPatientScreening().painLevel > 0);
  // isScreeningStatusValid = computed(() => Object.values(ScreeningStatus).includes(this.newPatientScreening().screeningStatus as ScreeningStatus));


  isFormValid = computed(() => {
    return (
      // this.isSelectedDiseaseValid() &&
      this.isChiefComplaintValid() &&
      this.isSymptomDescriptionValid() &&
      this.isSymptomDurationValid() &&
      this.isCurrentMedicationsValid() &&
      this.isPainLevelValid()
      // isScreeningStatusValid is often omitted from 'form can be submitted' logic, but left for consistency
      // && this.isScreeningStatusValid()
    );
  });

  // --- Lifecycle Hooks ---

  ngOnInit() {
    // this.fetchDiseases();
    this.setPatientIdFromAuth();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Fetches the current user ID and populates the patientId property if in creation mode.
   */
  setPatientIdFromAuth() {
    if (!this.isUpdateMode()) {
      const patientId = this.authService.getUserId();
      if (patientId) {

      }
    }
  }


  // fetchDiseases() {
  //   this.diseaseService.getAllDiseases().subscribe({
  //     next: (data: any[]) => {
  //       this.diseases.set(data.filter(h => h._id));
  //     },
  //     error: (err) => {
  //       console.error('Error fetching diseases:', err);
  //     }
  //   });
  // }

  updateField(fieldName: keyof PatientScreeningModel, event: any) {
    let value = event;
    if (event && event.target) {
      value = event.target.value;
    }

    // Convert painLevel to a number if it's the pain level field
    if (fieldName === 'painLevel') {
      value = parseInt(value, 10) || 0;
    }

    this.newPatientScreening.update(p => ({
      ...p,
      [fieldName]: value
    }));
  }

  // --- Submission Logic ---

  submitPatientScreening() {
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.error.set(true);
      this.message.set('Please correct the validation errors in the form.');
      return;
    }
    this.loading.set(true);

    if (this.isUpdateMode()) {
      this.updatePatientScreening();
    } else {
      this.addPatientScreening();
    }
  }

  addPatientScreening() {
    this.error.set(false);
    this.message.set('');
    this.loading.set(true);

    // 1. Create the DTO
    const patientScreeningDto: PatientScreeningDTO = {
      patientId: this.newPatientScreening().patientId._id || '',
      selectedDisease: this.newPatientScreening().selectedDisease?._id ?? null,
      chiefComplaint: this.newPatientScreening().chiefComplaint,
      symptomDescription: this.newPatientScreening().symptomDescription,
      duration: this.newPatientScreening().duration,
      currentMedications: this.currentMedicationsInput(),
      painLevel: this.newPatientScreening().painLevel
    };

    // 2. Subscribe using the DTO
    const sub = this.patientScreeningService.createPatientScreening(patientScreeningDto).subscribe({
      next: (createdPatientScreening) => {
        this.message.set('Patient Screening created successfully!');
        this.loading.set(false);
        this.router.navigate(['/patient/patient-screening-management']);
      },
      error: (err) => {
        this.error.set(true);
        const errorMessage = err.error?.message || err.message || 'An unknown error occurred during screening creation.';
        this.message.set(errorMessage);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  updatePatientScreening() {
    this.error.set(false);
    this.message.set('');
    this.loading.set(true);

    const screeningData = this.newPatientScreening();

    const screeningId = screeningData._id;
    if (!screeningId) {
      this.error.set(true);
      this.message.set('Cannot update: Screening ID is missing.');
      this.loading.set(false);
      return;
    }

    // 2. Create the Update DTO Payload
    const updatePayload: Partial<PatientScreeningDTO> = {
      patientId: screeningData.patientId._id || '',
      selectedDisease: screeningData.selectedDisease?._id ?? null,
      chiefComplaint: screeningData.chiefComplaint,
      symptomDescription: screeningData.symptomDescription,
      duration: screeningData.duration,
      currentMedications: this.currentMedicationsInput(),
      painLevel: screeningData.painLevel
    };

    // 3. Call the service with the DTO payload
    const sub = this.patientScreeningService.updatePatientScreening(screeningId, updatePayload).subscribe({
      next: () => {
        this.message.set('Patient Screening successfully updated!');
        this.loading.set(false);
        this.router.navigate(['/patient/patient-screening-management']);
      },
      error: (err) => {
        this.error.set(true);
        const errorMessage = err.error?.message || err.message || 'Failed to update patient screening.';
        this.message.set(errorMessage);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel() {
    this.isUpdateMode.set(false);
    this.router.navigate(['/patient/patient-screening-management']);
  }
}

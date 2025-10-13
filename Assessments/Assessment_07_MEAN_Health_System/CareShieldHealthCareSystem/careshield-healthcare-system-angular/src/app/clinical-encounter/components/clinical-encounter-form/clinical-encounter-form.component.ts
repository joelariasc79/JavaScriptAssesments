import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, Subscription, switchMap} from 'rxjs';
import { MaskedInputDirective } from '../../../shared/directives/masked-input.directive';
import { ActivatedRoute, Router } from '@angular/router';

import { ClinicalEncounterStatus } from '../../models/enums';
import { ClinicalEncounter, ClinicalEncounterPopulated} from '../../models/clinical-encounter.model';
import { Prescription } from '../../models/prescription.model';
import { ClinicalEncounterService  } from '../../services/clinical-encounter.service';
import { PatientScreeningService } from '../../../patient/components/patient-screening-management/services/patient-screening.service';
import {Appointment} from '../../../appointment-management/models/appointment.model';
import {PatientScreeningModel } from '../../../doctor/components/patient-screening-management/models/patient-screening.model';
import {finalize} from 'rxjs/operators';


@Component({
  selector: 'app-clinical-encounter-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './clinical-encounter-form.component.html',
  styleUrl: './clinical-encounter-form.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalEncounterFormComponent {
  // Service injection
  private clinicalEncounterService = inject(ClinicalEncounterService);
  private patientScreeningService = inject(PatientScreeningService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- State Signals ---
  encounter = signal<ClinicalEncounterPopulated | null>(null);
  screening = signal<PatientScreeningModel | null>(null);
  encounterId = signal<string | null>(null);

  // Form data (editable fields)
  diagnosis = signal<string>('');
  physicianNotes = signal<string>('');
  recommendations = signal<string | undefined>('');
  prescriptions = signal<Prescription[]>([]);
  status = signal<ClinicalEncounterStatus>(ClinicalEncounterStatus.Draft);

  // UI state
  isLoading = signal(true);
  isScreeningLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  // Helpers
  statusOptions = Object.values(ClinicalEncounterStatus);
  private subscription = new Subscription();

  // Computed property for current status
  encounterStatus = computed(() => this.encounter()?.status || this.status());

  /**
   * FIX: Computed signal to safely extract the screeningId.
   * Type assertion is done here, where it is valid (TS), not in the template (HTML).
   */
  screeningIdFromEncounter = computed<string | null>(() => {
    const encounterData = this.encounter();
    if (!encounterData) return null;

    // We assume appointmentId is populated with the Appointment object
    const appointment = encounterData.appointmentId as unknown as Appointment;
    return appointment?.screeningId || null;
  });

  // --- Initialization ---
  ngOnInit(): void {
    // 1. Get ID from route parameters
    this.subscription.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          const id = params.get('id');
          this.encounterId.set(id);

          if (!id) {
            this.errorMessage.set('Error: Clinical Encounter ID not provided in the route.');
            this.isLoading.set(false);
            return of(null);
          }

          this.isLoading.set(true);
          // 2. Calls the REAL service to get the Encounter data
          return this.clinicalEncounterService.getEncounterById(id);
        }),
        catchError(err => {
          this.errorMessage.set(err.message || 'Error loading the clinical encounter.');
          this.isLoading.set(false);
          return of(null);
        })
      ).subscribe(data => {
        this.isLoading.set(false);
        if (data) {
          this.encounter.set(data);
          this.initializeForm(data);

          // 3. Attempt to get the Screening ID using the new computed signal
          const screeningId = this.screeningIdFromEncounter();

          if (screeningId) {
            this.fetchScreeningData(screeningId);
          }
        }
      })
    );
  }

  /**
   * Fetches the detailed pre-assessment (screening) information if it exists.
   * @param screeningId ID of the screening associated with the appointment.
   */
  private fetchScreeningData(screeningId: string): void {
    this.isScreeningLoading.set(true);
    this.subscription.add(
      this.patientScreeningService.getPatientScreeningById(screeningId).pipe(
        finalize(() => this.isScreeningLoading.set(false)),
        catchError(err => {
          console.error('Error fetching patient screening:', err);
          const currentError = this.errorMessage() || '';
          this.errorMessage.set(currentError + ' | Warning: Could not load the patient pre-assessment.');
          return of(null);
        })
      ).subscribe(screeningData => {
        if (screeningData) {
          this.screening.set(screeningData);
        }
      })
    );
  }

  /**
   * Initializes the form signals with the loaded data.
   * @param encounter The loaded ClinicalEncounterPopulated object.
   */
  private initializeForm(encounter: ClinicalEncounterPopulated): void {
    this.diagnosis.set(encounter.diagnosis || '');
    this.physicianNotes.set(encounter.physicianNotes || '');
    this.recommendations.set(encounter.recommendations || '');

    // Clone prescriptions so ngModel can mutate them
    this.prescriptions.set([...(encounter.prescriptions || [])]);
    this.status.set(encounter.status || ClinicalEncounterStatus.Draft);
  }


  // --- Prescription Management ---

  /** Adds an empty prescription row. */
  addPrescription(): void {
    this.prescriptions.update(list => [
      ...list,
      { medicationName: '', dosage: '', frequency: '', notes: '' } as Prescription
    ]);
  }

  /** Removes a prescription row by index. */
  removePrescription(index: number): void {
    this.prescriptions.update(list => list.filter((_, i) => i !== index));
  }


  // --- Action Handlers ---

  /** Handles form submission to update the record. */
  saveEncounter(): void {
    const id = this.encounterId();

    // Verification of required fields (diagnosis and physicianNotes)
    if (!this.diagnosis().trim() || !this.physicianNotes().trim()) {
      this.errorMessage.set('The Primary Diagnosis and Physician Notes are mandatory fields.');
      return;
    }

    if (!id || this.isSaving()) {
      this.errorMessage.set('Cannot save: Encounter ID or saving state is invalid.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    // 1. Prepare the updates payload
    const updates: Partial<ClinicalEncounter> = {
      diagnosis: this.diagnosis(),
      physicianNotes: this.physicianNotes(),
      recommendations: this.recommendations(),
      // Filter incomplete prescriptions before sending
      prescriptions: this.prescriptions().filter(p => p.medicationName || p.dosage || p.frequency),
      status: this.status(),
    };

    // 2. Calls the REAL service to update
    this.subscription.add(
      this.clinicalEncounterService.updateEncounter(id, updates).subscribe({
        next: (updatedEnc) => {
          this.isSaving.set(false);
          this.router.navigate(['/doctor/clinical-encounter-management']);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.message || 'Error saving changes.');
        }
      })
    );
  }

  /** Redirects to the management view without saving changes. */
  cancel(): void {
    this.router.navigate(['/doctor/clinical-encounter-management']);
  }

  // --- Cleanup ---
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

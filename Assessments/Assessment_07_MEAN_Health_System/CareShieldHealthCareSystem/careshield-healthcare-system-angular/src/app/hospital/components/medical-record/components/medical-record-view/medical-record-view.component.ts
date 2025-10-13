import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, Subscription, switchMap} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicalEncounterPopulated } from '../../../../../clinical-encounter/models/clinical-encounter.model';
import { MedicalRecordService } from '../../services/medical-record.service';
import { ClinicalEncounterStatus } from '../../../../../clinical-encounter/models/enums';
import {Prescription} from '../../../../../clinical-encounter/models/prescription.model';

@Component({
  selector: 'app-medical-record-view',
  imports: [ CommonModule, FormsModule ],
  templateUrl: './medical-record-view.component.html',
  styleUrl: './medical-record-view.component.sass'
})
export class MedicalRecordViewComponent {
  // Service injection
  private medicalRecordService = inject(MedicalRecordService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- State Signals ---
  encounter = signal<ClinicalEncounterPopulated | null>(null);
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
          return this.medicalRecordService.getEncounterById(id);
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


  /** Redirects to the management view without saving changes. */
  close(): void {
    this.router.navigate(['/hospital/medical-record-management']);
  }

  // --- Cleanup ---
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}

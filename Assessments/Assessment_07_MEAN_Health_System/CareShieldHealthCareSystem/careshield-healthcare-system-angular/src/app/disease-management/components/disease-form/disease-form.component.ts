import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Disease, DiseaseReference } from '../../models/disease.model';
import { Specialty } from '../../models/specialty.model';
import { TreatmentProcedure } from '../../models/treatment-procedure.model';
import { DiseaseService } from '../../services/disease.service';
import { SpecialtyService } from '../../services/specialty.service';
// import { MaskedInputDirective } from '../../../shared/directives/masked-input.directive';
import { Router } from '@angular/router';


@Component({
  selector: 'app-disease-form',
  // imports: [CommonModule, FormsModule, MaskedInputDirective],
  imports: [CommonModule, FormsModule],
  templateUrl: './disease-form.component.html',
  styleUrl: './disease-form.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiseaseFormComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  constructor(
    private diseaseService: DiseaseService,
    private specialtyService: SpecialtyService,
    private router: Router
  ) {
    this.initializeDiseaseFromRouterState();
  }

  // --- Component State Signals ---
  diseases = signal<Disease[]>([]);
  specialties = signal<Specialty[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');
  isUpdateMode = signal(false);
  formSubmitted = signal(false);
  treatmentProceduresString = signal<string>('');

  // --- Disease Data Signal (Initial/Default State) ---
  newDisease = signal<Disease>({
    _id: '',
    name: '',
    specialty: { _id: '', name: '' } as Specialty,
    treatmentProcedures: [],
    estimatedDuration: '',
    estimatedCost: 0,
  });

  // --- Initialization Logic ---

  /**
   * Safely parses the treatmentProceduresString signal into an array of TreatmentProcedure objects.
   * Reports error if parsing fails or the result is not a non-empty array.
   */
  getParsedProcedures(): TreatmentProcedure[] | null {
    const jsonString = this.treatmentProceduresString().trim();
    if (jsonString.length === 0) return null;

    try {
      const procedures = JSON.parse(jsonString);

      // Ensure it's an array and has content
      if (Array.isArray(procedures) && procedures.length > 0) {
        return procedures as TreatmentProcedure[];
      }
      return null;
    } catch (e) {
      // JSON parsing failed
      return null;
    }
  }

  /**
   * Initializes the doctor form data and update mode from router state during navigation (for editing).
   */
  private initializeDiseaseFromRouterState(): void {
    const diseaseFromState = this.router.getCurrentNavigation()?.extras.state?.['disease'];

    if (diseaseFromState) {
      this.isUpdateMode.set(true);

      // Convert the array of objects to a pretty JSON string for display in the textarea
      if (Array.isArray(diseaseFromState.treatmentProcedures)) {
        this.treatmentProceduresString.set(JSON.stringify(diseaseFromState.treatmentProcedures, null, 2));
      } else if (typeof diseaseFromState.treatmentProcedures === 'string') {
        // Fallback for string data if the source was incorrect
        this.treatmentProceduresString.set(diseaseFromState.treatmentProcedures);
      }

      this.newDisease.set({
        ...diseaseFromState,
      });
    }
  }


  compareSpecialty(s1: Specialty | undefined, s2: Specialty | undefined): boolean {
    return s1 && s2 ? s1._id === s2._id : s1 === s2;
  }

  // --- Computed Validation Properties ---

  isNameValid = computed(() => this.newDisease().name.trim().length > 0);
  isSpecialtyValid = computed(() => !!this.newDisease().specialty?._id);

  // Checks if the procedures string is non-empty and valid JSON array
  areTreatmentProceduresValid = computed(() => !!this.getParsedProcedures());

  isEstimatedDurationValid = computed(() => (this.newDisease().estimatedDuration?.trim()?.length ?? 0) > 0);
  isEstimatedCostValid = computed(() => {
    const cost = this.newDisease().estimatedCost;
    return !!cost && cost > 0;
  });


  isFormValid = computed(() => {
    return (
      this.isNameValid() &&
      this.isSpecialtyValid() &&
      this.areTreatmentProceduresValid() && // Uses the safe validation
      this.isEstimatedDurationValid() &&
      this.isEstimatedCostValid()
    );
  });

  // --- Lifecycle Hooks ---

  ngOnInit() {
    this.fetchDiseases();
    this.fetchSpecialties();
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  fetchDiseases() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    const sub = this.diseaseService.getAllDiseases().subscribe({
      next: (data) => {
        this.diseases.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message || 'Failed to fetch diseases.');
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  fetchSpecialties() {
    this.specialtyService.getAllSpecialties().subscribe({
      next: (data) => {
        this.specialties.set(data.filter(s => s._id));
      },
      error: (err) => {
        console.error('Error fetching specialties:', err);
      }
    });
  }

  updateField(fieldName: keyof Disease, event: any) {
    this.newDisease.update(p => ({
      ...p,
      [fieldName]: event
    }));
  }

  updateTreatmentProceduresString(event: string) {
    this.treatmentProceduresString.set(event);
  }


  // --- Submission Logic ---

  submitDisease() {
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.error.set(true);
      this.message.set('Please correct the validation errors in the form.');
      return;
    }
    this.loading.set(true); // Start loading state before API call

    if (this.isUpdateMode()) {
      this.updateDisease();
    } else {
      this.addDisease();
    }
  }

  addDisease() {
    this.error.set(false);
    this.message.set('');
    this.loading.set(true);

    const procedures = this.getParsedProcedures();
    if (!procedures) {
      this.error.set(true);
      this.message.set('Treatment Procedures input is invalid. Please ensure it is a non-empty, valid JSON array.');
      this.loading.set(false);
      return;
    }

    // Now, procedures is guaranteed to be TreatmentProcedure[]
    const diseasePayload: Partial<DiseaseReference> = {
      ...this.newDisease(),
      specialty: this.newDisease().specialty._id, // Convert Specialty object to ID string
      // FIX: Assign the parsed array (TreatmentProcedure[]) instead of the raw string
      treatmentProcedures: procedures,
    };

    const sub = this.diseaseService.createDisease(diseasePayload).subscribe({
      next: (createdDisease) => {
        this.diseases.update(disease => [...disease, createdDisease]);
        this.message.set('Disease created successfully!!');
        this.loading.set(false);
        this.router.navigate(['/disease-management']);
      },
      error: (err) => {
        this.error.set(true);
        const errorMessage = err.error?.message || err.message || 'Failed to create disease due to a server error.';
        this.message.set(errorMessage);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  updateDisease() {
    this.error.set(false);
    this.message.set('');
    this.loading.set(true);

    const currentDisease = this.newDisease();
    const procedures = this.getParsedProcedures();

    if (!procedures) {
      this.error.set(true);
      this.message.set('Treatment Procedures input is invalid. Please ensure it is a non-empty, valid JSON array.');
      this.loading.set(false);
      return;
    }

    // Now, procedures is guaranteed to be TreatmentProcedure[]
    const diseaseToUpdate: Partial<DiseaseReference> = {
      ...currentDisease,
      specialty: currentDisease.specialty._id, // Convert Specialty object to ID string
      // FIX: Assign the parsed array (TreatmentProcedure[]) instead of the raw string
      treatmentProcedures: procedures,
    };

    const sub = this.diseaseService.updateDisease(currentDisease._id, diseaseToUpdate).subscribe({
      next: () => {
        this.message.set('Disease successfully updated!');
        this.loading.set(false);
        this.router.navigate(['/disease-management']);
      },
      error: (err) => {
        this.error.set(true);
        const errorMessage = err.error?.message || err.message || 'Failed to update disease due to a server error.';
        this.message.set(errorMessage);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel() {
    this.isUpdateMode.set(false);
    this.router.navigate(['/disease-management']);
  }


}

import { Component, signal, OnInit, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Doctor } from '../../../../../doctor-management/models/doctor.model';
import { DoctorService } from '../../../../../doctor-management/services/doctor.service';
import { Specialty } from '../../../../../shared/enums/specialty.enum';
import { Router } from '@angular/router';
import { HospitalService } from '../../../../../hospital-management/services/hospital.service';
import { Hospital } from '../../../../../hospital-management/models/hospital.model';
import { PatientScreeningModel } from '../../../patient-screening-management/models/patient-screening.model';
import { PatientScreeningService } from '../../../patient-screening-management/services/patient-screening.service';

// Define the statuses that mean a screening is active and can lead to an appointment.
// Screenings that are 'archived' or 'converted_to_appointment' are excluded.
const ACTIONABLE_SCREENING_STATUSES = ['submitted', 'reviewed', 'referred'];

@Component({
  selector: 'app-patient-appointment-select-specialty-doctor',
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-appointment-select-specialty-doctor.component.html',
  styleUrl: './patient-appointment-select-specialty-doctor.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PatientAppointmentSelectSpecialtyDoctorComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  // Inject the PatientScreeningService
  constructor(
    private doctorService: DoctorService,
    private hospitalService: HospitalService,
    private screeningService: PatientScreeningService, // New service injection
    private router: Router
  ) { }

  // --- New State Signals for Screening Selection ---
  patientScreenings = signal<PatientScreeningModel[]>([]); // List of patient's active screenings
  selectedScreeningId = signal<string | undefined>(undefined); // Store the ID of the selected screening

  // --- Doctor and Specialty Selection Signals ---
  selectedSpecialty = signal<Specialty | ''>('');
  filteredDoctors = signal<Doctor[]>([]);
  selectedDoctorId = signal<string | undefined>(undefined);

  // --- Existing Component State Signals ---
  loading = signal(false);
  loadingScreenings = signal(false); // New loading state for screenings
  error = signal(false);
  message = signal('');
  formSubmitted = signal(false);

  // --- Constants and Enums ---
  // Using generic object keys for specialties dropdown
  specialtyKeys = Object.keys(Specialty).filter(key => isNaN(Number(key)));

  // Combined validation: Requires a screening and a doctor selection
  isSelectionValid = computed(() =>
    !!this.selectedScreeningId() && !!this.selectedSpecialty() && !!this.selectedDoctorId()
  );

  ngOnInit(): void {
    this.loadScreenings();
  }

  /**
   * Loads the patient's existing screenings relevant to the current hospital context.
   * Filters out screenings that are already resolved or archived based on the schema.
   */
  loadScreenings(): void {
    this.loadingScreenings.set(true);
    const sub = this.screeningService.getPatientScreeningsInCurrentHospital().subscribe({
      next: (screenings: PatientScreeningModel[]) => {
        // Filter: Only include screenings with a status that is 'submitted', 'reviewed', or 'referred'.
        // Excludes 'archived' and 'converted_to_appointment'.
        const actionableScreenings = screenings.filter(s =>
          ACTIONABLE_SCREENING_STATUSES.includes(s.screeningStatus)
        );

        this.patientScreenings.set(actionableScreenings);
        this.loadingScreenings.set(false);
        if (actionableScreenings.length > 0) {
          // Pre-select the most recent screening if available
          this.selectedScreeningId.set(actionableScreenings[0]._id);
        }
      },
      error: (err) => {
        this.error.set(true);
        this.loadingScreenings.set(false);
        this.message.set('Failed to load your screening history.');
        console.error('Screening API Error:', err);
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Updates the selected screening ID.
   */
  onScreeningChange(event: Event): void {
    const screeningId = (event.target as HTMLSelectElement).value;
    this.selectedScreeningId.set(screeningId || undefined);
    // When screening changes, specialty/doctor might need reset, but we allow patient to proceed.
  }


  /**
   * Fetches doctors based on the selected specialty from the dropdown.
   */
  onSpecialtyChange(event: Event): void {
    const specialty = (event.target as HTMLSelectElement).value as Specialty;
    this.selectedSpecialty.set(specialty);
    this.selectedDoctorId.set(undefined);
    this.filteredDoctors.set([]);
    this.error.set(false);
    this.loading.set(true);

    if (specialty) {
      const sub = this.doctorService.getDoctorsBySpecialty(specialty).subscribe({
        next: (doctors: Doctor[]) => {
          this.filteredDoctors.set(doctors);
          this.loading.set(false);
          if (doctors.length === 0) {
            this.message.set(`No doctors found for ${specialty}.`);
          } else {
            this.message.set('');
          }
        },
        error: (err) => {
          this.error.set(true);
          this.loading.set(false);
          this.message.set('Failed to load doctors. Please try again.');
          console.error('Doctor API Error:', err);
        }
      });
      this.subscriptions.add(sub);
    } else {
      this.loading.set(false);
      this.message.set('');
    }
  }

  onNext(): void {
    this.formSubmitted.set(true);

    if (!this.isSelectionValid()) {
      this.message.set('Please ensure you have selected a screening, a specialty, and a doctor.');
      this.error.set(true);
      return;
    }
    this.error.set(false);

    const doctor = this.filteredDoctors().find(d => d._id === this.selectedDoctorId());

    // Find the full screening object to pass along
    const screening = this.patientScreenings().find(s => s._id === this.selectedScreeningId());


    if (!doctor || !screening) {
      this.message.set('An internal error occurred with the selection. Please refresh.');
      this.error.set(true);
      return;
    }

    // Navigate to the next step, passing the Doctor object and the selected Screening ID/Object
    this.router.navigate(['patient/doctor-availability'], {
      state: {
        doctor: doctor,
        screeningId: screening._id, // Pass the ID for creation
        chiefComplaint: screening.chiefComplaint, // Pass the complaint for the reason for visit
        hospitalId: screening.hospitalId
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['patient/appointment/patient-appointment-management']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected readonly Specialty = Specialty;
}

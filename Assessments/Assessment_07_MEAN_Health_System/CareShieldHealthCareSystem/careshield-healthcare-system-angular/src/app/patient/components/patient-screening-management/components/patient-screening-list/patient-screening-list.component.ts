import { Component, signal, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; // Import Router
import { AuthService } from '../../../../../auth/services/auth.service';
import { PatientScreeningModel } from '../../models/patient-screening.model';
import { PatientScreeningService } from '../../services/patient-screening.service';

@Component({
  selector: 'app-patient-screening-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-screening-list.component.html',
  styleUrl: './patient-screening-list.component.sass'
})
export class PatientScreeningListComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  constructor(
    private patientScreeningService: PatientScreeningService,
    private authService: AuthService,
    private router: Router // Inject Router service
  ) { }

  patientScreenings = signal<PatientScreeningModel[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  ngOnInit() {
    this.fetchPatientScreenings();
  }

  fetchPatientScreenings() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    // 1. Get the current patient's ID
    const patientId = this.authService.getUserId();

    if (!patientId) {
      this.error.set(true);
      this.message.set('Authentication error: Could not find patient ID.');
      this.loading.set(false);
      return;
    }

    // 2. Call the service method to fetch screenings by the patient's ID
    const sub = this.patientScreeningService.getPatientScreeningsByPatientId(patientId).subscribe({
      next: (data) => {
        // Data will be an array of PatientScreeningModel objects belonging to this patient
        this.patientScreenings.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(true);
        this.message.set(err.message || 'An unknown error occurred while fetching your screenings history.');
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  onCreateClick() {
    this.router.navigate(['/patient/patient-screening-registration']);
  }

  onUpdateClick(patientScreening: PatientScreeningModel) {
    this.router.navigate(['/patient/patient-screening-registration'], { state: { patientScreening } });
  }

  onDeleteClick(patientScreeningId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    const sub = this.patientScreeningService.deletePatientScreening(patientScreeningId).subscribe({
      next: () => {
        this.patientScreenings.update(patientScreenings => patientScreenings.filter(p => p._id !== patientScreeningId));
        this.message.set('Patient Screening successfully removed!');
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

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

}

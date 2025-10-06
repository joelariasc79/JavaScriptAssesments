import { Component, signal, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; // Import Router
import { Patient } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';
import { Hospital } from '../../../hospital-management/models/hospital.model';
import { HospitalService } from '../../../hospital-management/services/hospital.service';

@Component({
  selector: 'app-patient-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientListComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();

  constructor(
    private patientService: PatientService,
    private hospitalService: HospitalService,
    private router: Router // Inject Router service
  ) { }

  patients = signal<Patient[]>([]);
  hospitals = signal<Hospital[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  ngOnInit() {
    this.fetchPatients();
    this.fetchHospitals();
  }

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
        this.hospitals.set(data);
      }).catch((err) => {
      console.error('Error fetching hospitals:', err);
    });
  }

  onCreateClick() {
    this.router.navigate(['/patient-registration']);
  }

  onUpdateClick(patient: Patient) {
    this.router.navigate(['/patient-registration'], { state: { patient } });
  }

  onDeleteClick(patientId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    const sub = this.patientService.deletePatient(patientId).subscribe({
      next: () => {
        this.patients.update(patients => patients.filter(p => p._id !== patientId));
        this.message.set('Patient successfully removed!');
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

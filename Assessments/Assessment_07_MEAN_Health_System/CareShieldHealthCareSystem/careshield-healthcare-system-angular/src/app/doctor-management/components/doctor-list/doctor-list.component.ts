import { Component, signal, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; // Import Router
import { Doctor } from '../../models/doctor.model';
import { DoctorService } from '../../services/doctor.service';
import { Hospital } from '../../../hospital-management/models/hospital.model';
import { HospitalService } from '../../../hospital-management/services/hospital.service';

@Component({
  selector: 'app-doctor-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorListComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();

  constructor(
    private doctorService: DoctorService,
    private hospitalService: HospitalService,
    private router: Router // Inject Router service
  ) { }

  doctors = signal<Doctor[]>([]);
  hospitals = signal<Hospital[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  ngOnInit() {
    this.fetchHospitals();
    this.fetchDoctors();
  }

  fetchHospitals() {
    this.hospitalService.getHospitals().then(
      (data) => {
        this.hospitals.set(data);
      }).catch((err) => {
      console.error('Error fetching hospitals:', err);
    });
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

  onCreateClick() {
    this.router.navigate(['/doctor-registration']);
  }

  onUpdateClick(doctor: Doctor) {
    this.router.navigate(['/doctor-registration'], { state: { doctor } });
  }

  onDeleteClick(doctorId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    const sub = this.doctorService.deleteDoctor(doctorId).subscribe({
      next: () => {
        this.doctors.update(doctors => doctors.filter(p => p._id !== doctorId));
        this.message.set('Doctor successfully removed!');
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

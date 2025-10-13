import { Component, signal, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; // Import Router
import { AuthService } from '../../../../../auth/services/auth.service';
import { Appointment } from '../../../../../appointment-management/models/appointment.model';
import { AppointmentService } from '../../../../../appointment-management/services/appointment.service';

@Component({
  selector: 'app-patient-appointment-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-appointment-list.component.html',
  styleUrl: './patient-appointment-list.component.sass'
})
export class PatientAppointmentListComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  constructor(
    private patientAppointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router // Inject Router service
  ) { }

  patientAppointments = signal<Appointment[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  ngOnInit() {
    this.fetchAppointments();
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  fetchAppointments() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    //Defer the ID retrieval until after the current JavaScript event loop cycle
    setTimeout(() => {
      // 1. Get the current patient's ID
      const patientId = this.authService.getUserId();

      if (!patientId) {
        this.error.set(true);
        // Optional: use the corrected error message
        this.message.set('Authentication error: Could not find patient ID.');
        this.loading.set(false);
        return;
      }

      // 2. Call the service method to fetch screenings by the patient's ID
      const sub = this.patientAppointmentService.getAppointmentByPatientId(patientId).subscribe({
        next: (data) => {
          this.patientAppointments.set(data);
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(true);
          this.message.set(err.message || 'An unknown error occurred while fetching your appointments history.');
          this.loading.set(false);
        }
      });

      this.subscriptions.add(sub);
    }, 0); // Execute the fetching logic in the next tick of the event loop
  }

  onCreateClick() {
    this.router.navigate(['/patient/appointment/patient-appointment-start']);
  }

  onUpdateClick(appointment: Appointment) {
    this.router.navigate(['/patient/appointment/patient-appointment-start'], { state: { appointment } });
  }

  // Location where onPayClick is defined (e.g., Appointment List Component)

  onPayClick(appointmentId: string): void {
    console.log("Navigating to payment for ID: " + appointmentId);
    this.router.navigate(['/payment/payment-form', appointmentId]);
  }

  onDeleteClick(appointmentId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    const sub = this.patientAppointmentService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        this.patientAppointments.update(appointment => appointment.filter(p => p._id !== appointmentId));
        this.message.set('Appointment successfully removed!');
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

}

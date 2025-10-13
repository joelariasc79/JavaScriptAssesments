// src/app/payment/payments/payment-form.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../appointment-management/models/appointment.model';
import { AppointmentService } from '../../../appointment-management/services/appointment.service';
import { PaymentsService } from '../../services/payments.service';
import { PaymentStatus, PaymentMethod } from '../../models/enums';
import { finalize } from 'rxjs/operators';
import { DatePipe } from '@angular/common'; // Re-adding DatePipe as it's used in the template


@Component({
  selector: 'app-payment-form',
  standalone: true,
  // Note: Added DatePipe back for template usage
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.sass'
})
export class PaymentFormComponent implements OnInit {
  // --- INJECTIONS ---
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly appointmentService = inject(AppointmentService);
  private readonly paymentsService = inject(PaymentsService);

  // --- SIGNALS ---
  appointment = signal<Appointment | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // --- PAYMENT DATA ---
  selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CreditCard);


  ngOnInit(): void {
    // 1. Get the appointment ID from the URL route parameters
    this.route.params.subscribe(params => {
      // Expecting parameter name 'id' based on the routing fix
      const appointmentId = params['id'];
      if (appointmentId) {
        this.fetchAppointmentDetails(appointmentId);
      } else {
        // This should not happen if routing is configured as 'payment/payment-form/:id'
        this.error.set('Appointment ID is missing from the URL.');
      }
    });
  }

  // --- DATA FETCHING ---

  private fetchAppointmentDetails(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.appointmentService.getAppointmentById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (app: Appointment) => {
          this.appointment.set(app);
        },
        error: (err) => {
          console.error('Failed to fetch appointment:', err);
          // Assuming 403 error logic is handled by the component's consumer
          this.error.set('Could not load appointment details. Please ensure you have permission.');
        }
      });
  }

  // --- CORE PAYMENT LOGIC ---

  /**
   * Simulates a successful payment transaction and updates the status to 'paid'.
   */
  processPayment(): void {
    const currentAppointment = this.appointment();
    if (!currentAppointment) {
      this.error.set('No appointment data loaded.');
      return;
    }

    if (currentAppointment.paymentStatus === PaymentStatus.Paid) {
      this.error.set('This appointment is already paid.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // 1. Define the updates to send to the backend
    const paymentUpdates = {
      paymentStatus: PaymentStatus.Paid,
      paymentMethod: this.selectedPaymentMethod(),
    };

    // 2. Call the PaymentsService to update the backend
    this.paymentsService.updatePayment(currentAppointment._id!, paymentUpdates)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          // 3. Update the local signal and notify patient
          this.appointment.set(response.appointment);
          alert('Payment successful! Status updated to PAID.');

          // ✅ REDIRECT: Navigate to the specified patient appointment management view
          this.router.navigate(['/patient/appointment/patient-appointment-management']);
        },
        error: (err) => {
          console.error('Payment failed on API call:', err);
          this.error.set('Payment processing failed. Please check payment details.');
        }
      });
  }

  // --- UTILITY ---

  // Method to easily check if payment is needed
  isPaymentDue(): boolean {
    const status = this.appointment()?.paymentStatus;
    return status === PaymentStatus.Unpaid || status === PaymentStatus.Pending;
  }
}

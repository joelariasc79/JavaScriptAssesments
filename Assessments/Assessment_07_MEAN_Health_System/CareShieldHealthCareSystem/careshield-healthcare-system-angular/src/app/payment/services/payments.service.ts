import { PaymentMethod, PaymentStatus } from '../models/enums';
import { Appointment } from '../../appointment-management/models/appointment.model';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private readonly API_URL = `${environment.apiUrl}/payments`;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private getAuthHeaders() {
    let token = '';

    if (this.isBrowser) {
      token = localStorage.getItem('token') || '';
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Updates payment-related fields for an existing appointment.
   * @param appointmentId The ID of the appointment to update.
   * @param updates Object containing fields to update (e.g., paymentStatus, paymentMethod).
   * @returns An Observable of the updated Appointment object.
   */
  updatePayment(
    appointmentId: string,
    updates: { paymentStatus?: PaymentStatus, paymentMethod?: PaymentMethod, [key: string]: any }
  ): Observable<{ message: string, appointment: Appointment }> {

    // Construct the correct URL: /api/payment/:appointmentId
    const url = `${this.API_URL}/${appointmentId}`;

    return this.http.put<{ message: string, appointment: Appointment }>(
      url,
      updates,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        // Simple error logging and re-throw
        console.error('Error updating payment status:', error);
        return throwError(() => error);
      })
    );
  }
}

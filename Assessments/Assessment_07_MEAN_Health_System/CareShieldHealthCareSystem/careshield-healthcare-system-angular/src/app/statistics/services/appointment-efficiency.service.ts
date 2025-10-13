import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Verify if type is the same as model
import { NoShowRateResponse, CancellationRateResponse } from '../models/kpi-response.type';


@Injectable({
  providedIn: 'root'
})
export class AppointmentEfficiencyService {

  private readonly API_BASE_URL = `${environment.apiUrl}/appointmentEfficiency`;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Generates authorization headers using the token from localStorage (if available).
   */
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
   * Centralized error handling for all API requests in this service.
   * Logs the error details and returns a standardized error observable.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      if (error.error && error.error.message) {
        errorMessage = `Server Error (${error.status}): ${error.error.message}`;
      } else {
        errorMessage = `Server Error (${error.status}): ${error.statusText || 'No detailed message'}`;
      }
    }

    console.error('API Call Failed:', errorMessage, error);
    // Return an observable that throws an error to the subscriber
    return throwError(() => new Error(errorMessage));
  }


  /**
   * Fetches the No-Show Rate KPI for the user's selected hospital.
   * Rate = (No-Show Appointments / Total Appointments) * 100
   */
  getNoShowRate(): Observable<NoShowRateResponse> {
    console.log(`Fetching No-Show Rate from: ${this.API_BASE_URL}/no-show-rate`);
    return this.http.get<NoShowRateResponse>(
      `${this.API_BASE_URL}/no-show-rate`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      // Use .bind(this) to ensure 'this' context is available inside handleError
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Fetches the combined Cancellation Rate KPI for the user's selected hospital.
   * Rate = (No-Show + Canceled by Patient / Total Appointments) * 100
   */
  getCancellationRate(): Observable<CancellationRateResponse> {
    console.log(`Fetching Cancellation Rate from: ${this.API_BASE_URL}/cancellation-rate`);
    return this.http.get<CancellationRateResponse>(
      `${this.API_BASE_URL}/cancellation-rate`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      // Use .bind(this) to ensure 'this' context is available inside handleError
      catchError(this.handleError.bind(this))
    );
  }
}

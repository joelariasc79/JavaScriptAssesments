import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { AvailabilitySlots, NextAvailabilityResponse } from '../models/availability-slots.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorAvailabilityService {
  private readonly API_URL = `${environment.apiUrl}/doctors`;
  private isBrowser: boolean; // 2. Property to hold browser environment status

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
   * Fetches available time slots for a doctor within a specified date range.
   * @param doctorId The ObjectId of the doctor.
   * @param startDate The start date for the search (e.g., '2025-10-08').
   * @param endDate The end date for the search (e.g., '2025-10-14').
   * @param durationMinutes The desired slot duration (defaults to 30).
   * @returns An Observable resolving to { availableSlots: AvailableSlot[] }.
   */
  getDoctorAvailability(
    doctorId: string,
    startDate: string,
    endDate: string,
    durationMinutes: number = 30
  ): Observable<AvailabilitySlots> {

    // 1. Construct HttpParams for safe URL query building
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('durationMinutes', durationMinutes.toString());

    // 2. Make GET request, passing params and headers
    return this.http.get<AvailabilitySlots>(`${this.API_URL}/availability/slots`, {
      headers: this.getAuthHeaders(),
      params: params
    })
      .pipe(
        catchError(error => {
          console.error('Error fetching doctor availability:', error);
          return throwError(() => new Error('Failed to fetch doctor availability.'));
        })
      );
  }

  /**
   * Fetches the single next available time slot for a doctor starting from tomorrow.
   * @param doctorId The ObjectId of the doctor.
   * @param durationMinutes The desired slot duration (defaults to 30).
   * @returns An Observable resolving to { nextAvailableSlot: AvailableSlot | null }.
   */
  getNextAvailableSlot(
    doctorId: string,
    durationMinutes: number = 30
  ): Observable<NextAvailabilityResponse> {

    // 1. Construct HttpParams for safe URL query building
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('durationMinutes', durationMinutes.toString());

    // 2. Make GET request to the /next endpoint
    return this.http.get<NextAvailabilityResponse>(`${this.API_URL}/availability/next`, {
      headers: this.getAuthHeaders(),
      params: params
    })
      .pipe(
        catchError(error => {
          console.error('Error fetching next available slot:', error);
          return throwError(() => new Error('Failed to fetch next available slot.'));
        })
      );
  }
}

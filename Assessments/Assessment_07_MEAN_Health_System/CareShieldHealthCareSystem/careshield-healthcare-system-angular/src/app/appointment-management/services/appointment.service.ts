import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly API_URL = `${environment.apiUrl}/appointments`;
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

  // R - Read All: Returns ALL Patient Screenings (Admin/Doctor access)
  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.API_URL, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching patient screenings:', error);
          return throwError(() => new Error('Failed to fetch all patient screenings.'));
        })
      );
  }

  /**
   * R - Read One: Returns a single Patient Screening by its unique ID (_id)
   * This corresponds to the backend route GET /api/patients/patientScreenings/:id
   */
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching patient screening with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to fetch patient screening with ID ${id}.`));
        })
      );
  }

  /**
   * R - Read By Patient ID: Returns all Patient Screenings for a given Patient ID.
   * This corresponds to the backend route GET /api/patients/patientScreenings/:patientId
   * NOTE: The path is the same as getPatientScreeningById, the backend must distinguish the usage based on context (i.e., patient role/ownership).
   */
  getAppointmentByPatientId(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/users/${patientId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching patient screenings for patient ID ${patientId}:`, error);
          return throwError(() => new Error(`Failed to fetch patient screenings for patient ID ${patientId}.`));
        })
      );
  }


  // C - Create: Sends payload for a new Patient Screening
  createAppointment(screeningData: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(this.API_URL, screeningData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating patient screening:', error);
          return throwError(() => new Error('Failed to create the patient screening.'));
        })
      );
  }

  // U - Update: Sends payload to update an existing Patient Screening
  updateAppointment(id: string, screeningData: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/${id}`, screeningData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error updating patient screening with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to update patient screening with ID ${id}.`));
        })
      );
  }

  // D - Delete
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error deleting patient screening with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to delete patient screening with ID ${id}.`));
        })
      );
  }

}

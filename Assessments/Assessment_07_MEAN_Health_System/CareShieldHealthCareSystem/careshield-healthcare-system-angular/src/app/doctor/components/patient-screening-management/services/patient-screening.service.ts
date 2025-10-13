import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PatientScreeningModel, PatientScreeningDTO } from '../models/patient-screening.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientScreeningService {

  private readonly API_URL_SCREENINGS = `${environment.apiUrl}/patients/patientScreening`;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ... (getAuthHeaders is correct) ...
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
  getAllPatientScreenings(): Observable<PatientScreeningModel[]> {
    return this.http.get<PatientScreeningModel[]>(this.API_URL_SCREENINGS, { headers: this.getAuthHeaders() })
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
  getPatientScreeningById(id: string): Observable<PatientScreeningModel> {
    return this.http.get<PatientScreeningModel>(`${this.API_URL_SCREENINGS}/${id}`, { headers: this.getAuthHeaders() })
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
  getPatientScreeningsByPatientId(patientId: string): Observable<PatientScreeningModel[]> {
    return this.http.get<PatientScreeningModel[]>(`${this.API_URL_SCREENINGS}/${patientId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching patient screenings for patient ID ${patientId}:`, error);
          return throwError(() => new Error(`Failed to fetch patient screenings for patient ID ${patientId}.`));
        })
      );
  }


  // C - Create: Sends payload for a new Patient Screening
  createPatientScreening(screeningData: Partial<PatientScreeningDTO>): Observable<PatientScreeningModel> {
    return this.http.post<PatientScreeningModel>(this.API_URL_SCREENINGS, screeningData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating patient screening:', error);
          return throwError(() => new Error('Failed to create the patient screening.'));
        })
      );
  }

  // U - Update: Sends payload to update an existing Patient Screening
  updatePatientScreening(id: string, screeningData: Partial<PatientScreeningDTO>): Observable<PatientScreeningModel> {
    return this.http.put<PatientScreeningModel>(`${this.API_URL_SCREENINGS}/${id}`, screeningData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error updating patient screening with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to update patient screening with ID ${id}.`));
        })
      );
  }

  // D - Delete
  deletePatientScreening(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_SCREENINGS}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error deleting patient screening with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to delete patient screening with ID ${id}.`));
        })
      );
  }
}

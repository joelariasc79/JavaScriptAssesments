import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Patient } from '../models/patient.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private readonly API_URL_PATIENTS = `${environment.apiUrl}/patients`;
  private readonly API_URL_USERS = `${environment.apiUrl}/users`;
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

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.API_URL_PATIENTS, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching patients:', error);
          return throwError(() => new Error('Failed to fetch patients.'));
        })
      );
  }

  getPatient(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.API_URL_PATIENTS}/${patientId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching patient:', error);
          return throwError(() => new Error('Failed to fetch patient.'));
        })
      );
  }

  createPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${this.API_URL_PATIENTS}`, patient, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating patient:', error);
          return throwError(() => new Error('Failed to create the patient.'));
        })
      );
  }

  updatePatient(patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.API_URL_PATIENTS}/${patient._id}`, patient, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating patient:', error);
          return throwError(() => new Error('Failed to update the patient.'));
        })
      );
  }

  deletePatient(patientId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_USERS}/${patientId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting patient:', error);
          return throwError(() => new Error('Failed to delete patient.'));
        })
      );
  }
}

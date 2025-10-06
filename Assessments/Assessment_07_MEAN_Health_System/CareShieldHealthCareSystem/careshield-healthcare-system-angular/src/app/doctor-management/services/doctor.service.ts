import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Doctor } from '../models/doctor.model';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly API_URL_DOCTORS= `${environment.apiUrl}/doctors`;
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

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.API_URL_DOCTORS, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching doctors:', error);
          return throwError(() => new Error('Failed to fetch doctors.'));
        })
      );
  }

  getDoctor(doctorId: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.API_URL_DOCTORS}/${doctorId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching doctor:', error);
          return throwError(() => new Error('Failed to fetch doctor.'));
        })
      );
  }

  createDoctor(doctor: Doctor): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.API_URL_DOCTORS}`, doctor, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating doctor:', error);
          return throwError(() => new Error('Failed to create the doctor.'));
        })
      );
  }

  updateDoctor(doctor: Doctor): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.API_URL_DOCTORS}/${doctor._id}`, doctor, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating doctor:', error);
          return throwError(() => new Error('Failed to update the doctor.'));
        })
      );
  }

  deleteDoctor(doctorId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_USERS}/${doctorId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting doctor:', error);
          return throwError(() => new Error('Failed to delete doctor.'));
        })
      );
  }

}

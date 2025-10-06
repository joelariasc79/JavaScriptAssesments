import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Specialty } from '../models/specialty.model';
import { environment } from '../../../environments/environment'; // Assuming standard environment path

@Injectable({
  providedIn: 'root',
})
export class SpecialtyService {
  // Use environment variable and set API URL path
  private readonly API_URL_SPECIALTIES = `${environment.apiUrl}/specialties`;
  private isBrowser: boolean; // Flag to check if running in a browser

  constructor(
    private http: HttpClient,
    // Inject PLATFORM_ID for SSR/browser detection (required for localStorage)
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Retrieves authentication headers including the Bearer token from localStorage.
   * Only attempts to read localStorage if running in a browser environment.
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

  // R - Read All
  getAllSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(this.API_URL_SPECIALTIES, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching specialties:', error);
          return throwError(() => new Error('Failed to fetch specialties.'));
        })
      );
  }

  // R - Read One
  getSpecialtyById(id: string): Observable<Specialty> {
    return this.http.get<Specialty>(`${this.API_URL_SPECIALTIES}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching specialty with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to fetch specialty with ID ${id}.`));
        })
      );
  }

  // C - Create
  createSpecialty(specialty: Specialty): Observable<Specialty> {
    return this.http.post<Specialty>(this.API_URL_SPECIALTIES, specialty, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating specialty:', error);
          return throwError(() => new Error('Failed to create the specialty.'));
        })
      );
  }

  // U - Update
  updateSpecialty(id: string, specialty: Partial<Specialty>): Observable<Specialty> {
    return this.http.put<Specialty>(`${this.API_URL_SPECIALTIES}/${id}`, specialty, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error updating specialty with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to update specialty with ID ${id}.`));
        })
      );
  }

  // D - Delete
  deleteSpecialty(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_SPECIALTIES}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error deleting specialty with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to delete specialty with ID ${id}.`));
        })
      );
  }
}

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Disease, DiseaseReference } from '../models/disease.model'; // Assuming Disease and DiseaseReference interfaces
import { environment } from '../../../environments/environment'; // Assuming standard environment path

@Injectable({
  providedIn: 'root',
})
export class DiseaseService {
  // Use environment variable and set API URL path
  private readonly API_URL_DISEASES = `${environment.apiUrl}/diseases`;
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

  // R - Read All: Returns Diseases with populated Specialty object
  getAllDiseases(): Observable<Disease[]> {
    return this.http.get<Disease[]>(this.API_URL_DISEASES, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching diseases:', error);
          return throwError(() => new Error('Failed to fetch diseases.'));
        })
      );
  }

  // R - Read One: Returns Disease with populated Specialty object
  getDiseaseById(id: string): Observable<Disease> {
    return this.http.get<Disease>(`${this.API_URL_DISEASES}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching disease with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to fetch disease with ID ${id}.`));
        })
      );
  }

  // C - Create: Sends payload using the ID string for Specialty (DiseaseReference)
  createDisease(disease: Partial<DiseaseReference>): Observable<Disease> {
    return this.http.post<Disease>(this.API_URL_DISEASES, disease, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating disease:', error);
          return throwError(() => new Error('Failed to create the disease.'));
        })
      );
  }

  // U - Update: Sends payload using the ID string for Specialty (DiseaseReference)
  updateDisease(id: string, disease: Partial<DiseaseReference>): Observable<Disease> {
    return this.http.put<Disease>(`${this.API_URL_DISEASES}/${id}`, disease, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error updating disease with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to update disease with ID ${id}.`));
        })
      );
  }

  // D - Delete
  deleteDisease(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_DISEASES}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error deleting disease with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to delete disease with ID ${id}.`));
        })
      );
  }
}

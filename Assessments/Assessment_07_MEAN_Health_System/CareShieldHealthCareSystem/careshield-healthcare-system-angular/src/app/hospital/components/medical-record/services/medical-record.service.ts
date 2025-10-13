import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ClinicalEncounterPopulated } from '../../../../clinical-encounter/models/clinical-encounter.model';
import { environment } from '../../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private readonly API_URL = `${environment.apiUrl}/clinical-encounters`;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    // Inject PLATFORM_ID for SSR/browser detection
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Retrieves authentication headers including the Bearer token from localStorage.
   */
  private getAuthHeaders() {
    let token = '';
    if (this.isBrowser) {
      // Access token from localStorage only in browser environment.
      token = localStorage.getItem('token') || '';
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Centralized error handling for API calls.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Medical Record API Error:', error);
    let errorMessage = 'An unknown error occurred!';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Server returned code ${error.status}: ${error.statusText}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  getCurrentHospitalAllEncounters(): Observable<ClinicalEncounterPopulated[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClinicalEncounterPopulated[]>(`${this.API_URL}/current-hospital`, { headers }).pipe(
      catchError(this.handleError)
    );
  }
  /**
   * @description Retrieves a single clinical encounter by ID.
   * @param id The ID of the encounter.
   * @returns Observable of the ClinicalEncounterPopulated object.
   */
  getEncounterById(id: string): Observable<ClinicalEncounterPopulated> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClinicalEncounterPopulated>(`${this.API_URL}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }
}

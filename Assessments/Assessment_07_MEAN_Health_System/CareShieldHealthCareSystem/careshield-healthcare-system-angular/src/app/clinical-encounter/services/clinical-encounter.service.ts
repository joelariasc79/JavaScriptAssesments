import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // Added 'map'
import { ClinicalEncounter, ClinicalEncounterPopulated } from '../models/clinical-encounter.model';
import { environment } from '../../../environments/environment'; // Assuming standard environment path


@Injectable({
  providedIn: 'root'
})
export class ClinicalEncounterService {
  // Use environment variable and set API URL path
  private readonly API_URL_ALL = `${environment.apiUrl}/patients/clinical-encounters`;
  private readonly API_URL = `${environment.apiUrl}/clinical-encounters`; // Corrected path and name
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
      // NOTE: Using localStorage for token storage as per your existing code.
      token = localStorage.getItem('token') || '';
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Centralized error handling for all API calls.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An unknown error occurred!';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Server returned code ${error.status}: ${error.statusText}`;
    }
    return throwError(() => new Error(errorMessage));
  }


  /* -------------------------------------------
   * CRUD OPERATIONS
   * ------------------------------------------- */

  /**
   * @description Creates a new clinical encounter record. (Doctor only)
   * @param encounter The ClinicalEncounter data object.
   * @returns Observable of the newly created ClinicalEncounterPopulated object.
   */
  createEncounter(encounter: Omit<ClinicalEncounter, '_id' | 'createdAt' | 'updatedAt' | 'signedOffAt'>): Observable<ClinicalEncounterPopulated> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ encounter: ClinicalEncounterPopulated }>(this.API_URL, encounter, { headers }).pipe(
      map(response => response.encounter),
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

  /**
   * @description Updates an existing clinical encounter record. (Original Doctor or Admin)
   * @param id The ID of the encounter to update.
   * @param updates The fields to update (Partial ClinicalEncounter).
   * @returns Observable of the updated ClinicalEncounterPopulated object.
   */
  updateEncounter(id: string, updates: Partial<ClinicalEncounter>): Observable<ClinicalEncounterPopulated> {
    const headers = this.getAuthHeaders();
    return this.http.put<{ encounter: ClinicalEncounterPopulated }>(`${this.API_URL}/${id}`, updates, { headers }).pipe(
      map(response => response.encounter),
      catchError(this.handleError)
    );
  }

  /**
   * @description Deletes a clinical encounter record. (Admin only)
   * @param id The ID of the encounter to delete.
   * @returns Observable of the deletion response.
   */
  deleteEncounter(id: string): Observable<{ message: string, deletedEncounterId: string }> {
    const headers = this.getAuthHeaders();
    return this.http.delete<{ message: string, deletedEncounterId: string }>(`${this.API_URL}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /* -------------------------------------------
   * LIST RETRIEVAL ENDPOINTS
   * ------------------------------------------- */

  /**
   * @description Gets all clinical encounters for a specific patient.
   * Calls the protected endpoint: GET /api/clinical-encounters/patient/:patientId
   * @returns Observable array of ClinicalEncounterPopulated objects.
   */
  getPatientEncounters(): Observable<ClinicalEncounterPopulated[]> {
    const headers = this.getAuthHeaders();
    // Constructs the full URL: /api/patient/clinical-encounters
    return this.http.get<ClinicalEncounterPopulated[]>(this.API_URL_ALL, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * @description Gets ALL clinical encounters for the hospital the patient is currently selected into. (Staff/Admin only)
   * Endpoint: GET /api/clinical-encounters/current-hospital
   * @returns Observable array of ClinicalEncounterPopulated objects.
   */
  getCurrentHospitalAllEncounters(): Observable<ClinicalEncounterPopulated[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClinicalEncounterPopulated[]>(`${this.API_URL}/current-hospital`, { headers }).pipe(
      catchError(this.handleError)
    );
  }
}

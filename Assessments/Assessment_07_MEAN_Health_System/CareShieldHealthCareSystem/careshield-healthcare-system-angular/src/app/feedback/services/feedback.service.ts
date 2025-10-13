import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DoctorFeedback } from '../models/doctor-feedback.model';

/**
 * @description Interface for the Doctor's average rating aggregation result.
 */
export interface DoctorAverageRating {
  averageRating: number;
  reviewCount: number;
  doctorId: string;
}

/**
 * @description Service to handle all API calls related to doctor feedback.
 */
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly API_URL_BASE = `${environment.apiUrl}/doctor-feedback`;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
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
      token = localStorage.getItem('token') || '';
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // -------------------------------------------------------------------
  // READ API: GET /user-hospital-feedbacks
  // -------------------------------------------------------------------
  getUserHospitalFeedbacks(): Observable<DoctorFeedback[]> {
    return this.http.get<DoctorFeedback[]>(`${this.API_URL_BASE}/user-hospital-feedbacks`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching user feedback list:', error);
          return throwError(() => new Error('Failed to fetch user feedback list.'));
        })
      );
  }

  // -------------------------------------------------------------------
  // NEW AGGREGATION API: GET /hospital/average-ratings
  // -------------------------------------------------------------------
  getHospitalDoctorAverages(): Observable<DoctorAverageRating[]> {
    return this.http.get<DoctorAverageRating[]>(`${this.API_URL_BASE}/hospital/average-ratings`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching hospital doctor averages:', error);
          return throwError(() => new Error('Failed to fetch hospital doctor averages.'));
        })
      );
  }

  // -------------------------------------------------------------------
  // READ API: GET /:id (Single Feedback Record)
  // -------------------------------------------------------------------
  getFeedbackById(id: string): Observable<DoctorFeedback> {
    return this.http.get<DoctorFeedback>(`${this.API_URL_BASE}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching feedback with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to fetch feedback with ID ${id}.`));
        })
      );
  }

  // -------------------------------------------------------------------
  // CREATE API: POST /
  // -------------------------------------------------------------------
  submitFeedback(feedbackData: { clinicalEncounterId: string; rating: number; comment?: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL_BASE}`, feedbackData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error submitting feedback:', error);
          return throwError(() => new Error('Failed to submit feedback.'));
        })
      );
  }

  // -------------------------------------------------------------------
  // UPDATE API: PUT /:id
  // -------------------------------------------------------------------
  updateFeedback(id: string, updateData: { rating?: number; comment?: string }): Observable<any> {
    return this.http.put<any>(`${this.API_URL_BASE}/${id}`, updateData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error updating feedback with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to update feedback with ID ${id}.`));
        })
      );
  }

  // -------------------------------------------------------------------
  // DELETE API: DELETE /:id
  // -------------------------------------------------------------------
  deleteFeedback(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL_BASE}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error deleting feedback with ID ${id}:`, error);
          return throwError(() => new Error(`Failed to delete feedback with ID ${id}.`));
        })
      );
  }
}

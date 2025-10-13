import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DoctorFeedback } from '../../../models/doctor-feedback.model'; // Assuming path
import { FeedbackService, DoctorAverageRating } from '../../../services/feedback.service'; // Assuming path

// Map structure for easy lookup of average ratings by Doctor ID
interface DoctorAverageMap {
  [doctorId: string]: DoctorAverageRating;
}

/**
 * Component for the Doctor's view, displaying all received feedback and the
 * doctor's overall average rating (aggregated result).
 * This component uses the DoctorFeedback interface directly (doctorId is a string ID).
 */
@Component({
  selector: 'app-doctor-feedback-result',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, DecimalPipe],
  templateUrl: './doctor-feedback-result.component.html',
  styleUrls: ['./doctor-feedback-result.component.sass']
})
export class DoctorFeedbackResultComponent implements OnInit {
  // Using the base DoctorFeedback model where doctorId is a string ID.
  feedbacks: DoctorFeedback[] = [];
  doctorAverageMap: DoctorAverageMap = {};

  isLoading: boolean = false;
  errorMessage: string | null = null;
  // Removed successMessage and hasPendingEncounters as they are not needed for the doctor's view

  constructor(
    private feedbackService: FeedbackService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeedbacksAndAverages();
  }

  /**
   * Fetches user feedbacks (simulating doctor's received feedbacks) and all
   * hospital doctor averages concurrently.
   */
  loadFeedbacksAndAverages(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // 1. Fetch user feedbacks (simulating all feedback received by the doctor)
    this.feedbackService.getUserHospitalFeedbacks().subscribe({
      next: (data) => {
        // FIX: Defensively check if patientId is an object (due to Mongoose embedding)
        // and extract the string ID (._id) to prevent the 'substring is not a function' error.
        this.feedbacks = data.map(f => ({
          ...f,
          patientId: (typeof f.patientId === 'object' && f.patientId !== null)
            ? (f.patientId as any)._id
            : f.patientId
        })) as DoctorFeedback[];

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });

    // 2. Fetch doctor averages and create map for quick lookup
    this.feedbackService.getHospitalDoctorAverages().subscribe({
      next: (averages) => {
        this.doctorAverageMap = averages.reduce((acc, current) => {
          acc[current.doctorId] = current;
          return acc;
        }, {} as DoctorAverageMap);
      },
      error: (error) => {
        console.error('Failed to load doctor averages:', error);
      }
    });
  }

  /**
   * Looks up the average rating and review count for a given doctor ID.
   */
  getDoctorAverage(doctorId: string): DoctorAverageRating | undefined {
    return this.doctorAverageMap[doctorId];
  }

  // All CUD-related methods have been removed as requested for the doctor's view.
}

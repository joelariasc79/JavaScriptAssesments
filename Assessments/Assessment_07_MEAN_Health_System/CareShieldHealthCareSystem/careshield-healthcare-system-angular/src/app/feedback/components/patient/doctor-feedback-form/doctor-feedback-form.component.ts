import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // NEW: Import Router
import { ClinicalEncounterPopulated } from '../../../../clinical-encounter/models/clinical-encounter.model';
import { FeedbackService } from '../../../services/feedback.service';
import { DoctorFeedback } from '../../../models/doctor-feedback.model';
import {catchError, Observable, of, tap} from 'rxjs';
// Assuming this service exists and has the getPatientEncounters method
import { ClinicalEncounterService } from '../../../../clinical-encounter/services/clinical-encounter.service';

@Component({
  selector: 'app-doctor-feedback-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-feedback-form.component.html',
  styleUrl: './doctor-feedback-form.component.sass'
})
export class DoctorFeedbackFormComponent implements OnInit {
  // 1. INPUT: Now takes an optional feedbackId for editing mode
  @Input() feedbackId: string | null = null;
  @Output() feedbackSubmitted = new EventEmitter<DoctorFeedback>();

  // New State for Encounter Selection
  encounters: ClinicalEncounterPopulated[] = [];
  selectedEncounterId: string | null = null;

  // Form State
  formRating: number | null = null;
  formComment: string = '';
  ratingError: string = '';

  // API State
  existingFeedback: DoctorFeedback | null = null;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Derived State
  isUpdateMode: boolean = false;

  constructor(
    private feedbackService: FeedbackService,
    private encounterService: ClinicalEncounterService,
    private router: Router // Inject Router for navigation
  ) {}

  // Derived Property to get the currently selected encounter object
  get selectedEncounter(): ClinicalEncounterPopulated | undefined {
    return this.encounters.find(e => e._id === this.selectedEncounterId);
  }

  ngOnInit(): void {
    this.loadEncounters();
  }

  /**
   * Fetches all clinical encounters for the patient.
   */
  private loadEncounters(): void {
    this.isLoading = true;
    this.encounterService.getPatientEncounters().pipe(
      tap(encounters => {
        this.encounters = encounters;
        // Select the most recent encounter with status 'Final' by default
        const defaultEncounter = encounters.find(e => e.status === 'Final');
        if (defaultEncounter) {
          this.selectedEncounterId = defaultEncounter._id;
        }

        if (this.feedbackId) {
          this.loadExistingFeedback(this.feedbackId);
        } else {
          this.isLoading = false;
        }
      }),
      catchError(error => {
        this.errorMessage = 'Failed to load the list of clinical encounters.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Loads existing feedback and sets the form/state for update mode.
   * @param id The ID of the feedback to load.
   */
  private loadExistingFeedback(id: string): void {
    this.isUpdateMode = true;
    this.feedbackService.getFeedbackById(id).pipe(
      tap(feedback => {
        this.existingFeedback = feedback;
        this.formRating = feedback.rating;
        this.formComment = feedback.comment || '';
        this.selectedEncounterId = feedback.clinicalEncounterId; // Link to the correct encounter

        // Ensure the linked encounter is in the list (omitted logic for brevity)
      }),
      catchError(error => {
        this.errorMessage = 'Failed to load existing feedback.';
        return of(null);
      })
    ).subscribe(() => {
      this.isLoading = false;
    });
  }

  /**
   * Handles the change event when the user selects a new encounter.
   */
  onEncounterChange(): void {
    // When the user changes the selection, clear existing feedback/state if necessary
    if (!this.feedbackId) {
      this.existingFeedback = null;
      this.isUpdateMode = false;
    }
  }

  /**
   * Sets the rating and clears any related validation error.
   * @param rating The selected rating (1-5).
   */
  setRating(rating: number): void {
    this.formRating = rating;
    this.ratingError = '';
  }

  /**
   * Handles form validation, API submission, and subsequent redirection.
   */
  onSubmit(): void {
    const encounter = this.selectedEncounter;

    if (!encounter) {
      this.errorMessage = 'You must select a clinical encounter.';
      return;
    }

    if (this.formRating === null || this.formRating < 1 || this.formRating > 5) {
      this.ratingError = 'Please select a rating between 1 and 5 stars.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const data = {
      rating: this.formRating,
      comment: this.formComment,
    };

    let apiCall: Observable<any>;

    if (this.existingFeedback && this.existingFeedback._id) {
      // Update existing feedback
      apiCall = this.feedbackService.updateFeedback(this.existingFeedback._id, data);
    } else {
      // Submit new feedback
      const newFeedbackData = {
        clinicalEncounterId: encounter._id,
        ...data
      };
      apiCall = this.feedbackService.submitFeedback(newFeedbackData);
    }

    apiCall.pipe(
      tap((response: DoctorFeedback) => {
        this.existingFeedback = response;
        this.isUpdateMode = true;
        this.successMessage = this.isUpdateMode
          ? 'Feedback updated successfully.'
          : 'Feedback submitted successfully.';

        this.feedbackSubmitted.emit(response);

        // Redirect after success
        setTimeout(() => {
          this.successMessage = null;
          this.router.navigate(['feedback/patient/feedback-management']);
        }, 1500);
      }),
      catchError(error => {
        this.errorMessage = error.message || 'Feedback operation failed.';
        setTimeout(() => this.errorMessage = null, 5000);
        return of(null);
      })
    ).subscribe(() => {
      this.isSubmitting = false;
    });
  }

  /**
   * Redirects the user to the feedback management page.
   */
  onCancel(): void {
    this.router.navigate(['feedback/patient/feedback-management']);
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- REQUIRED IMPORT
import { DoctorFeedback } from '../../../models/doctor-feedback.model';
import { FeedbackService } from '../../../services/feedback.service';

@Component({
  selector: 'app-doctor-feedback-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-feedback-list.component.html',
  styleUrl: './doctor-feedback-list.component.sass',
})
export class DoctorFeedbackListComponent implements OnInit {

  // List of feedbacks already GIVEN by the patient.
  feedbacks: DoctorFeedback[] = [];

  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null; // Added to show success status after deletion

  // Property to simulate if the patient has encounters pending feedback.
  hasPendingEncounters: boolean = true;

  constructor(
    private feedbackService: FeedbackService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  /**
   * Loads the feedbacks given by the current patient.
   */
  loadFeedbacks(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null; // Clear success message on reload

    this.feedbackService.getUserHospitalFeedbacks().subscribe({
      next: (data) => {
        // In a real application, the backend should have already filtered by patientId.
        this.feedbacks = data;
        this.isLoading = false;

        // // We simulate checking for pending encounters
        // this.hasPendingEncounters = (this.feedbacks.length < 5);
      },
      error: (err) => {
        console.error('Error fetching feedbacks:', err);
        this.errorMessage = 'Could not load your feedbacks.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navigates to the generic feedback form.
   */
  goToAddFeedback(): void {
    this.router.navigate(['/feedback/patient/add-feedback']);
  }

  /**
   * Navigates to the feedback update form for a specific record.
   */
  goToUpdateFeedback(feedback: DoctorFeedback): void {
    // Assuming the DoctorFeedback model has an _id field for the record ID
    // and a route for updating exists, e.g., '/feedback/patient/update-feedback/:id'
    const feedbackId = (feedback as any)._id; // Cast to access _id property
    if (feedbackId) {
      // NOTE: This route is hypothetical and must exist in your routing configuration.
      this.router.navigate([`/feedback/patient/add-feedback/${feedbackId}`]);
    } else {
      this.errorMessage = 'Cannot update feedback: ID is missing.';
    }
  }

  /**
   * Deletes a feedback record and reloads the list.
   * NOTE: In a production app, this would be preceded by a custom modal for confirmation.
   */
  deleteFeedback(feedback: DoctorFeedback): void {
    const feedbackId = (feedback as any)._id; // Cast to access _id property
    const doctorName = (feedback.doctorId as any)?.name || 'Unknown Doctor';

    if (!feedbackId) {
      this.errorMessage = 'Cannot delete feedback: ID is missing.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.feedbackService.deleteFeedback(feedbackId).subscribe({
      next: () => {
        this.successMessage = `Feedback for Dr. ${doctorName} successfully deleted.`;
        this.loadFeedbacks(); // Reload list to reflect changes
      },
      error: (err) => {
        console.error('Error deleting feedback:', err);
        this.errorMessage = `Failed to delete feedback for Dr. ${doctorName}.`;
        this.isLoading = false;
      }
    });
  }
}

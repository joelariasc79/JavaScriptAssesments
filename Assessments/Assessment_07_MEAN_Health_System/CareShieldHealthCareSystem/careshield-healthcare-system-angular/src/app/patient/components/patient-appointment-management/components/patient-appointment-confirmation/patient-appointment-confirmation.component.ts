import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentCreationDTO } from '../../../../../appointment-management/models/appointment.model';
import { AppointmentService } from '../../../../../appointment-management/services/appointment.service';
import { Doctor } from '../../../../../doctor-management/models/doctor.model';
import { DoctorService } from '../../../../../doctor-management/services/doctor.service';
import { PatientScreeningModel } from '../../../patient-screening-management/models/patient-screening.model';
import { PatientScreeningService } from '../../../patient-screening-management/services/patient-screening.service';


// --- Component Implementation ---

@Component({
  selector: 'app-patient-appointment-confirmation',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './patient-appointment-confirmation.component.html',
  styleUrl: './patient-appointment-confirmation.component.sass'
})
export class PatientAppointmentConfirmationComponent implements OnInit {
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);
  private screeningService = inject(PatientScreeningService);

  // Reactive State
  bookingData = signal<Appointment | null>(null);
  screening = signal<PatientScreeningModel | null>(null);
  doctor = signal<Doctor | null>(null);
  appointmentNotes = signal<string>('');

  loading = signal(true);
  error = signal<string | null>(null);
  bookingMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadNavigationState();
  }

  loadNavigationState(): void {
    this.loading.set(true);
    this.error.set(null);

    const historyState = this.router.lastSuccessfulNavigation?.extras.state || window.history.state;

    if (!historyState || !historyState['bookingData']) {
      this.error.set('Booking details missing. Please restart the appointment process.');
      this.loading.set(false);
      console.log('Incomplete navigation state received: Missing bookingData key on state.', historyState);
      return;
    }

    const data: Appointment = historyState['bookingData'];

    if (!data.doctorId || !data.hospitalId || !data.screeningId || !data.startTime || !data.durationMinutes) {
      this.error.set('Incomplete booking data. Essential details are missing. Please restart the process.');
      this.loading.set(false);
      console.log('Incomplete booking data properties:', data);
      return;
    }

    if (typeof data.startTime === 'string') {
      data.startTime = new Date(data.startTime);
    }
    if (typeof data.endTime === 'string') {
      data.endTime = new Date(data.endTime);
    }

    this.bookingData.set(data);
    this.appointmentNotes.set(data.notes || '');
    console.log('Successfully loaded booking data.', data);

    this.fetchDoctor(data.doctorId);
    this.fetchScreening(data.screeningId);
    this.loading.set(false);
  }

  // --- START OF UPDATED FETCH METHODS ---

  /** FETCH: Fetch doctor details based on ID using DoctorService */
  private fetchDoctor(doctorId: string): void {
    this.doctorService.getDoctor(doctorId).subscribe({
      next: (doctor) => {
        this.doctor.set(doctor);
      },
      error: (err) => {
        console.error('Failed to fetch doctor details:', err);
        // Set a patient-facing error message
        this.error.set(`Failed to load doctor details: ${err.message || 'Server error.'}`);
      }
    });
  }

  /** FETCH: Fetch screening details based on ID using PatientScreeningService */
  private fetchScreening(screeningId: string): void {
    // Note: The service method is named getPatientScreeningById, use that one.
    this.screeningService.getPatientScreeningById(screeningId).subscribe({
      next: (screening) => {
        this.screening.set(screening);

        // Update bookingData with the chief complaint from the fetched screening
        this.bookingData.update(data => {
          if (data) {
            return {
              ...data,
              reasonForVisit: screening.chiefComplaint
            };
          }
          return data;
        });
      },
      error: (err) => {
        console.error('Failed to fetch screening details:', err);
        // Set a patient-facing error message
        this.error.set(`Failed to load screening details: ${err.message || 'Server error.'}`);
      }
    });
  }

  // --- END OF UPDATED FETCH METHODS ---


  /**
   * Confirms and creates the appointment via the AppointmentService.
   */
  // Inside PatientAppointmentConfirmationComponent

  /**
   * Confirms and creates the appointment via the AppointmentService.
   */
  bookAppointment(): void {
    const data = this.bookingData();
    const screening = this.screening();
    const doctor = this.doctor();

    if (!data || !screening || !doctor) {
      this.error.set('Cannot book: Appointment, Doctor, or Screening data is not fully loaded.');
      this.loading.set(false);
      return;
    }

    // 1. Determine the Patient ID
    let finalPatientId: string | undefined;

    // FIX: Handle patientId as an unpopulated ID string (which the console log shows)
    if (typeof screening.patientId === 'string') {
      finalPatientId = screening.patientId;
    }
    // Fallback check for the populated object (if the backend changes later)
    else if (screening.patientId && typeof screening.patientId === 'object' && screening.patientId._id) {
      finalPatientId = screening.patientId._id;
    }


    if (!finalPatientId) {
      this.loading.set(false);
      this.error.set('Fatal error: Could not determine patient ID from screening data. The patient ID field is null or malformed.');
      console.error('Screening data missing patient ID:', screening);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // 2. Prepare Payload
    const finalAppointmentPayload: Partial<AppointmentCreationDTO> = {
      doctorId: data.doctorId,
      patientId: finalPatientId, // Use the safely extracted ID (now guaranteed string)
      screeningId: data.screeningId,
      hospitalId: data.hospitalId,
      durationMinutes: data.durationMinutes,

      // Convert Date objects to ISO strings for API compatibility.
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),

      // Use Chief Complaint as the final reasonForVisit
      reasonForVisit: screening.chiefComplaint,
      notes: this.appointmentNotes(),

      // Set initial status and payment details
      status: 'pending' as any,
      feeAmount: data.feeAmount,
      paymentStatus: data.paymentStatus,
      paymentTransactionId: data.paymentTransactionId,
      paymentMethod: data.paymentMethod,
    };

    console.log('Final booking payload sent to API:', finalAppointmentPayload);

    // 3. Service Call
    this.appointmentService.createAppointment(finalAppointmentPayload as Partial<Appointment>)
      .subscribe({
        next: (responseAppointment) => {
          this.loading.set(false);
          this.bookingData.set(responseAppointment);
          this.bookingMessage.set(`Your appointment on ${new Date(responseAppointment.startTime).toLocaleDateString()} with Dr. ${doctor.name} has been confirmed!`);

          this.router.navigate(['/patient/appointment/patient-appointment-management']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(`Booking failed: ${err.message || 'Server error.'}`);
          console.error('Appointment creation failed:', err);
        }
      });
  }

  onCancel(): void {
    // Navigate back to the scheduling or screening page
    this.router.navigate(['/patient/appointment/patient-appointment-management']);
  }
}

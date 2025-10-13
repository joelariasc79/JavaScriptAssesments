import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AvailableSlot, AvailabilitySlots, NextAvailabilityResponse } from '../../models/availability-slots.model';
import { DoctorAvailabilityService} from '../../services/doctor-availability.service';
import {AppointmentService} from '../../../../../appointment-management/services/appointment.service';
import {Router} from '@angular/router';
import {Doctor} from '../../../../../doctor-management/models/doctor.model';
import {Hospital} from '../../../../../hospital/models/hospital.model';

// Helper interface for grouping slots in the template
interface GroupedSlots {
  [dateString: string]: AvailableSlot[]; // 'YYYY-MM-DD' -> [slot1, slot2, ...]
}

@Component({
  selector: 'app-patient-appointment-doctor-availability',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './patient-appointment-doctor-availability.component.html',
  styleUrl: './patient-appointment-doctor-availability.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientAppointmentDoctorAvailabilityComponent implements OnInit {

  // Dependencies
  private availabilityService = inject(DoctorAvailabilityService);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private datePipe = inject(DatePipe);

  // Doctor and Screening State (from navigation)
  doctor = signal<Doctor | null>(null);
  doctorId = signal('');
  hospitalId = signal<Hospital | null>(null);
  screeningId = signal('');
  chiefComplaint = signal('');

  // Availability Search Parameters
  durationMinutes = signal(30);

  // Calendar State
  currentStartDate = signal<Date | null>(null);
  currentEndDate = signal<Date | null>(null);

  // Slot Data State
  availableSlots = signal<AvailableSlot[]>([]);
  groupedSlots = signal<GroupedSlots>({});

  // UI State
  loading = signal(true);
  initializationMessage = signal('Finding the next available appointment...');
  error = signal<string | null>(null);

  // Computed state for template rendering
  hasSlots = computed(() => this.availableSlots().length > 0);
  slotDateKeys = computed(() => Object.keys(this.groupedSlots()).sort()); // Get sorted dates for iteration

  ngOnInit(): void {
    this.loadNavigationState();

    if (this.doctorId()) {
      this.fetchInitialAvailability();
    } else {
      this.loading.set(false);
      this.error.set('Failed to load doctor or screening details from navigation. Please go back.');
    }
  }

  /**
   * Retrieves data passed via router state from the previous page.
   */
  private loadNavigationState(): void {
    const state = this.router.getCurrentNavigation()?.extras.state || history.state;

    const doctor: Doctor | undefined = state['doctor'];
    const screeningId: string | undefined = state['screeningId'];
    const chiefComplaint: string | undefined = state['chiefComplaint'];
    const hospitalId: Hospital | undefined = state['hospitalId'];

    if (doctor && doctor._id && screeningId && chiefComplaint) {
      this.doctor.set(doctor);
      this.doctorId.set(doctor._id.trim());
      this.hospitalId.set(hospitalId ?? null);
      this.screeningId.set(screeningId);
      this.chiefComplaint.set(chiefComplaint);
    } else {
      this.error.set('Missing data. Please go back to the doctor selection screen.');
      console.error('Incomplete navigation state received:', state);
    }
  }

  /**
   * Step 1: Find the single next available slot to set the calendar's starting week.
   */
  fetchInitialAvailability(): void {
    this.loading.set(true);
    this.error.set(null);
    this.initializationMessage.set('Finding the next available appointment...');

    // DEBUG: Confirm which ID is being sent to the service
    console.log('API Call: Getting Next Available Slot for Doctor ID:', this.doctorId());

    this.availabilityService.getNextAvailableSlot(this.doctorId(), this.durationMinutes()).subscribe({
      next: (response: NextAvailabilityResponse) => {
        if (response.nextAvailableSlot) {
          const nextSlotTime = new Date(response.nextAvailableSlot.startTime);

          // Calculate the start of the week (normalized to start of the day the slot falls on)
          let initialStartDate = new Date(nextSlotTime);
          initialStartDate.setHours(0, 0, 0, 0);

          // Calculate the end of the initial 7-day window (7 days later, exclusive end)
          let initialEndDate = new Date(initialStartDate);
          initialEndDate.setDate(initialEndDate.getDate() + 7);

          this.currentStartDate.set(initialStartDate);
          this.currentEndDate.set(initialEndDate);

          this.fetchAvailabilityForWeek(initialStartDate, initialEndDate);
        } else {
          this.loading.set(false);
          this.error.set(response.message || 'No available slots found within the search range (90 days).');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Failed to check for the next available slot.');
        console.error('Initial availability fetch error:', err);
      }
    });
  }

  /**
   * Step 2: Fetch all available slots for the given 7-day range.
   * @param startDate The start date of the search range (YYYY-MM-DD format).
   * @param endDate The end date of the search range (YYYY-MM-DD format).
   */
  fetchAvailabilityForWeek(startDate: Date, endDate: Date): void {
    this.loading.set(true);
    this.error.set(null);
    this.initializationMessage.set('Loading calendar week...');

    const startStr = this.datePipe.transform(startDate, 'yyyy-MM-dd')!;
    const endStr = this.datePipe.transform(endDate, 'yyyy-MM-dd')!;

    // DEBUG: Confirm which ID is being sent to the service
    console.log('API Call: Getting Weekly Availability for Doctor ID:', this.doctorId(), 'Dates:', startStr, 'to', endStr);

    this.availabilityService.getDoctorAvailability(this.doctorId(), startStr, endStr, this.durationMinutes()).subscribe({
      next: (response: AvailabilitySlots) => {
        this.availableSlots.set(response.availableSlots);
        this.groupSlotsByDay(response.availableSlots);
        this.loading.set(false);
        this.initializationMessage.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Failed to load availability for this week.');
        console.error('Weekly availability fetch error:', err);
      }
    });
  }

  /**
   * Groups slots into an object where keys are date strings (YYYY-MM-DD).
   * This is necessary for easy rendering in the template.
   */
  private groupSlotsByDay(slots: AvailableSlot[]): void {
    const grouped: GroupedSlots = {};
    const start = this.currentStartDate()!;
    const end = this.currentEndDate()!;
    let current = new Date(start);

    // Initialize 7 days in the current window with empty arrays
    while (current < end) {
      const dateKey = this.datePipe.transform(current, 'yyyy-MM-dd')!;
      grouped[dateKey] = [];
      current.setDate(current.getDate() + 1);
    }

    // Populate the groups with actual slots
    slots.forEach(slot => {
      const dateKey = this.datePipe.transform(new Date(slot.startTime), 'yyyy-MM-dd')!;
      if (grouped[dateKey]) {
        grouped[dateKey].push(slot);
      }
    });

    this.groupedSlots.set(grouped);
  }

  /**
   * Navigation: Shifts the calendar view 7 days into the future.
   */
  goToNextWeek(): void {
    if (this.currentStartDate() && this.currentEndDate()) {
      const newStart = new Date(this.currentStartDate()!);
      newStart.setDate(newStart.getDate() + 7);

      const newEnd = new Date(this.currentEndDate()!);
      newEnd.setDate(newEnd.getDate() + 7);

      this.currentStartDate.set(newStart);
      this.currentEndDate.set(newEnd);
      this.fetchAvailabilityForWeek(newStart, newEnd);
    }
  }

  /**
   * Navigation: Shifts the calendar view 7 days into the past.
   * This is disabled if the new start date is before the initial found slot date.
   */
  goToPreviousWeek(): void {
    if (this.currentStartDate() && this.currentEndDate() && this.canGoPrevious()) {
      const newStart = new Date(this.currentStartDate()!);
      newStart.setDate(newStart.getDate() - 7);

      const newEnd = new Date(this.currentEndDate()!);
      newEnd.setDate(newEnd.getDate() - 7);

      this.currentStartDate.set(newStart);
      this.currentEndDate.set(newEnd);
      this.fetchAvailabilityForWeek(newStart, newEnd);
    }
  }

  /**
   * Determines if the 'Previous Week' button should be enabled.
   * Disallows going back before the initial slot's day.
   */
  canGoPrevious(): boolean {
    // Implement check based on initial slot date if needed, but for simplicity, allow any previous week
    // unless you want to enforce a hard limit based on the current date/time.
    // For now, let's allow movement back, assuming the server will handle conflicts.
    // A simple check is to prevent going back to a date before "today at midnight".
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.currentStartDate()) {
      const potentialNewStart = new Date(this.currentStartDate()!);
      potentialNewStart.setDate(potentialNewStart.getDate() - 7);
      // Only allow going back if the *new* start date is not before today.
      return potentialNewStart >= today;
    }
    return false;
  }

  /**
   * Formats the day header for the template display.
   */
  formatDayHeader(dateKey: string): string {
    const date = new Date(dateKey + 'T00:00:00'); // Ensure timezone neutrality when parsing key
    return this.datePipe.transform(date, 'fullDate')!;
  }

  /**
   * Formats time from ISO string for display (e.g., 10:00 AM).
   */
  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return this.datePipe.transform(date, 'shortTime')!;
  }

  bookAppointment(slot: AvailableSlot): void {
    // Data needed for appointment creation
    const bookingData = {
      doctorId: this.doctorId(),
      hospitalId: this.hospitalId(),
      screeningId: this.screeningId(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      reasonForVisit: this.chiefComplaint(),
    };

    console.log('Attempting to book slot, navigating to confirmation:', bookingData);

    // Navigating to the confirmation screen with the collected data
    this.router.navigate(['/patient/confirm-appointment'], {
      state: { bookingData }
    });
  }

  onCancel(): void {
    this.router.navigate(['patient/appointment/patient-appointment-management']);
  }
}

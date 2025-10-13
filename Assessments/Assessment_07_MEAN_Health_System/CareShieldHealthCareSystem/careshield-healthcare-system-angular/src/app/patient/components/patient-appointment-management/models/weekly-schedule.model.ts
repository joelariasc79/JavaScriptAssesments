/**
 * @file weekly-schedule.models.ts
 * @description TypeScript interface for the WeeklySchedule data models
 * used in the Angular frontend application.
 */

/**
 * Interface representing a doctor's weekly shift schedule, defining when a doctor is generally available.
 * Note: MongoDB ObjectIds are typically handled as strings in the Angular application.
 */
export interface WeeklySchedule {
  // Unique MongoDB ID (optional as it might not be present until saved)
  _id?: string;

  // Core Reference (ObjectId converted to string)
  doctorId: string;    // Reference to the doctor (User ID)

  // Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  dayOfWeek: number;

  // Start time of the shift (e.g., '09:00') - stored as a string
  startTime: string;

  // End time of the shift (e.g., '17:00') - stored as a string
  endTime: string;

  // Duration of standard appointments in minutes (e.g., 30)
  slotDuration: number;
}

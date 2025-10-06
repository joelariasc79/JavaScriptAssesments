import {DoctorBlockoutType} from './enums';

/**
 * Interface representing a specific period when a doctor is unavailable (blocked out)
 * regardless of their regular weekly schedule.
 * Note: MongoDB ObjectIds are handled as strings. Dates are handled as Date objects
 * for easier manipulation in the Angular application.
 */
export interface DoctorBlockoutModel {
  // Unique MongoDB ID (optional as it might not be present until saved)
  _id?: string;

  // Core Reference (ObjectId converted to string)
  doctorId: string;    // Reference to the doctor (User ID)

  // Details
  reason: string;

  // Time Period
  startDate: Date;     // When the blockout period starts
  endDate: Date;       // When the blockout period ends

  // Type of blockout
  type: DoctorBlockoutType;
}

import {AppointmentStatus} from './enums';

/**
 * Interface representing the Appointment document structure from MongoDB/Mongoose.
 * * Note: MongoDB ObjectIds are typically handled as strings in the Angular application.
 * Dates are represented using the standard JavaScript Date object (or strings if
 * you prefer to handle ISO formatting manually).
 */
export interface AppointmentModel {
  // Unique MongoDB ID (optional as it might not be present until saved)
  _id?: string;

  // Core References (ObjectIds converted to strings)
  doctorId: string;    // Reference to the doctor (User ID)
  patientId: string;   // Reference to the patient (User ID)
  hospitalId: string | null; // Reference to the hospital (Hospital ID)

  // Time and Duration
  startTime: Date;       // The exact start date and time
  endTime: Date;         // The exact end date and time
  durationMinutes: number;

  // Status and Details
  status: AppointmentStatus;
  reasonForVisit: string;
  notes?: string; // Optional field based on the schema

  // Timestamps added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

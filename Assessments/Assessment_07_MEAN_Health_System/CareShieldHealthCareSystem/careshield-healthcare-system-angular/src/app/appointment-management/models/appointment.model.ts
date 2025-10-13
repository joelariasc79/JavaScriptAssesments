import { AppointmentStatus } from './enums';

/**
 * Literal union type representing the possible payment statuses of an appointment.
 * Corresponds to the 'paymentStatus' enum in the Mongoose schema.
 */
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'waived';

/**
 * Literal union type representing the possible payment methods.
 * Corresponds to the 'paymentMethod' enum in the Mongoose schema.
 */
export type PaymentMethod = 'credit_card' | 'insurance' | 'cash' | 'transfer' | 'other';


/**
 * Interface representing the Appointment document structure from MongoDB/Mongoose.
 * Note: MongoDB ObjectIds are typically handled as strings in the Angular application.
 * Dates are represented using the standard JavaScript Date object.
 */
export interface Appointment {
  // Unique MongoDB ID (optional as it might not be present until saved)
  _id?: string;

  // Core References (ObjectIds converted to strings)
  doctorId: string;    // Reference to the doctor (User ID)
  patientId: string;   // Reference to the patient (User ID)
  hospitalId: string | null; // Reference to the hospital (Hospital ID)
  screeningId: string | null;

  // Time and Duration
  startTime: Date;       // The exact start date and time
  endTime: Date;         // The exact end date and time
  durationMinutes: number;

  // Status and Details
  status: AppointmentStatus;
  reasonForVisit: string;
  notes?: string; // Optional based on the schema

  // --- Payment and Billing ---

  // The total fee agreed upon for this specific appointment
  feeAmount: number;

  // The current status of the payment
  paymentStatus: PaymentStatus;

  // Reference ID from the payment processor (Optional)
  paymentTransactionId: string | null;

  // Method used for payment (Optional)
  paymentMethod?: PaymentMethod;

  // Timestamps added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentCreationDTO {
  doctorId: string;
  patientId: string;
  hospitalId: string | null;
  screeningId: string | null;

  // DATES ARE STRINGS FOR API TRANSPORT
  startTime: string;
  endTime: string;
  durationMinutes: number;

  status: AppointmentStatus;
  reasonForVisit: string;
  notes?: string;

  feeAmount: number;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string | null;
  paymentMethod?: PaymentMethod;
}

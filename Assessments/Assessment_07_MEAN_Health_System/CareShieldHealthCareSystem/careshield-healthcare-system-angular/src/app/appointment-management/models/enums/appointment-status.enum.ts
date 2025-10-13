/**
 * @file appointment-status.enum.ts
 * @description TypeScript enum defining the possible status values for an Appointment.
 */

export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  CanceledByDoctor = 'canceled_by_doctor',
  CanceledByPatient = 'canceled_by_patient',
}


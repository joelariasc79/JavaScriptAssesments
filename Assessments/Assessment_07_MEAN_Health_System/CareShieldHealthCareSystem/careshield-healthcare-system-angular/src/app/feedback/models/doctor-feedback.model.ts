/**
 * @description Interface representing the DoctorFeedback document in the Angular frontend.
 * Mirrors the structure of the Mongoose DoctorFeedbackSchema.
 */
export interface DoctorFeedback {
  _id?: string;
  clinicalEncounterId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

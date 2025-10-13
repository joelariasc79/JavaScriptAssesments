/**
 * @description Interface for the Prescription sub-document array.
 */
export interface Prescription {
  medicationName: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

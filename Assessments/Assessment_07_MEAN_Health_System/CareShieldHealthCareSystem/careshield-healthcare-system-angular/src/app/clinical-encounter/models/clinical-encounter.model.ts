import { ClinicalEncounterStatus } from './enums';
import { Prescription } from './prescription.model';
import { Patient } from '../../patient-management/models/patient.model';
import { Doctor } from '../../doctor-management/models/doctor.model';
import { Hospital } from '../../hospital-management/models/hospital.model';

/**
 * @description The base model for a Clinical Encounter, reflecting the database structure
 * before any population occurs (i.e., when all references are still ObjectId strings).
 */
export interface ClinicalEncounter {

  _id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Core References (IDs)
  appointmentId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;

  // Appointment Context Fields (Copied from Appointment)
  reasonForVisit: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  durationMinutes: number;

  // Clinical Data
  diagnosis: string;
  physicianNotes: string;
  recommendations?: string;
  prescriptions: Prescription[];
  status: ClinicalEncounterStatus;
  signedOffAt: string | null; // ISO date string or null
}


/**
 * @description Interface for Clinical Encounter objects returned from GET APIs
 * that use Mongoose's .populate() method.
 */
export interface ClinicalEncounterPopulated extends Omit<ClinicalEncounter, 'patientId' | 'doctorId' | 'hospitalId'> { // Renamed from IClinicalEncounterPopulated and updated Omit base type
                                                                                                                       // Overwrite the ID strings with the populated objects
  patientId: Patient;
  doctorId: Doctor;
  hospitalId: Hospital;
}

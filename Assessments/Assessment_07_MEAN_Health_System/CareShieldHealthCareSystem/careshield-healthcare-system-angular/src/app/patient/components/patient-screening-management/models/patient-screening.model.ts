import {MedicationModel} from './medication.model';
import {SymptomDuration, ScreeningStatus} from './enums';
import {Patient} from '../../../../patient-management/models/patient.model';
import {Disease} from '../../../../disease-management/models/disease.model';
import {Hospital} from '../../../../hospital/models/hospital.model';

export interface PatientScreeningModel {
  _id: string;
  // References are fully populated objects
  patientId: Patient;
  hospitalId: Hospital;
  selectedDisease: Disease | null;
  appointmentId: string | null; // Assumes Appointment ID is passed as a string

  // Patient Provided Information
  chiefComplaint: string;
  symptomDescription: string;
  duration: SymptomDuration;
  currentMedications: MedicationModel[];
  painLevel: number;

  // Status and Timestamps
  screeningStatus: ScreeningStatus;

  createdAt: Date;
  updatedAt: Date;
}

export interface PatientScreeningDTO {
  // Only pass the IDs for references
  patientId: string;
  selectedDisease: string | null;
  chiefComplaint: string;
  symptomDescription: string;
  duration: SymptomDuration;
  currentMedications: String;
  painLevel: number;
}

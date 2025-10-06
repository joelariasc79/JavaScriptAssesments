import { TreatmentProcedure } from './treatment-procedure.model';
import { Specialty } from './specialty.model';

export interface Disease {
  _id: string;
  name: string;
  specialty: Specialty;
  treatmentProcedures: TreatmentProcedure[];
  estimatedDuration?: string; // Optional and defaults to 'Varies'
  estimatedCost?: number;     // Optional and defaults to 0
}

// --- Optional: Interface for Disease creation/update (using the ID) ---

/**
 * Interface used specifically when sending data to the POST or PUT endpoints,
 * where only the Specialty ObjectId is required.
 */
export interface DiseaseReference {
  _id: string;
  name: string;
  specialty: string; // The specialty is just the ObjectId string
  treatmentProcedures: TreatmentProcedure[];
  estimatedDuration?: string;
  estimatedCost?: number;
}

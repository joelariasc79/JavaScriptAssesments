/**
 * @description Defines the possible status states for a Clinical Encounter record,
 * matching the enumeration used in the MongoDB schema.
 */
export enum ClinicalEncounterStatus {
  Draft = 'Draft',
  Final = 'Final',
  Amended = 'Amended',
}

// Optional: A list of values useful for iterating in templates (e.g., in a dropdown).
export const CLINICAL_ENCOUNTER_STATUS_VALUES = Object.values(ClinicalEncounterStatus);

export const SYMPTOM_DURATION_OPTIONS = [
  'Less than 24 hours',
  '1-7 days',
  '1-4 weeks',
  '1-6 months',
  'More than 6 months',
] as const; // 'as const' ensures TypeScript knows the exact string literals

export type SymptomDuration = typeof SYMPTOM_DURATION_OPTIONS[number];

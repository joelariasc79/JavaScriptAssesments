// Define the expected structure of the available slot response for type safety
export interface AvailableSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationMinutes: number;
}

export interface AvailabilitySlots {
  availableSlots: AvailableSlot[];
}

export interface NextAvailabilityResponse {
  message: string;
  nextAvailableSlot: AvailableSlot | null;
}

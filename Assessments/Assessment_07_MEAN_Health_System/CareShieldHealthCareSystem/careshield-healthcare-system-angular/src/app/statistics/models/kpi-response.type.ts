/**
 * Interface representing the common structure for all Appointment Efficiency KPI responses.
 */
export interface BaseKpiResponse {
  hospitalId: string;
  totalAppointments: number;
  unit: string; // e.g., "%"
  message?: string; // Optional message if total appointments is zero
}

/**
 * Interface for the No-Show Rate API response.
 * GET /api/appointmentEfficiency/no-show-rate
 */
export interface NoShowRateResponse extends BaseKpiResponse {
  noShowRate: number;
  noShowAppointments: number;
}

/**
 * Interface for the combined Cancellation Rate API response (No-Show + Canceled by Patient).
 * GET /api/appointmentEfficiency/cancellation-rate
 */
export interface CancellationRateResponse extends BaseKpiResponse {
  cancellationRate: number;
  problemAppointments: number; // Sum of no-show and patient cancellations
}

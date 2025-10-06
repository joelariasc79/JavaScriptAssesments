/**
 * @file doctor-blockout.models.ts
 * @description TypeScript interface and type definitions for the DoctorBlockout data models
 * used in the Angular frontend application.
 */

// 1. Define a union type for the allowed 'type' values
export enum DoctorBlockoutType {
  Vacation = 'vacation',
  Conference = 'conference',
  DailyBreak = 'daily_break',
  SickLeave = 'sick_leave',
}

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { BaseKpiResponse, NoShowRateResponse, CancellationRateResponse } from '../../../models/kpi-response.type';
import { AppointmentEfficiencyService } from '../../../services/appointment-efficiency.service';


@Component({
  selector: 'app-appointment-efficiency-kpis',
  imports: [CommonModule],
  templateUrl: './appointment-efficiency-kpis.component.html',
  styleUrl: './appointment-efficiency-kpis.component.sass'
})
export class AppointmentEfficiencyKpisComponent implements OnInit {
// Dependencies
  private service = inject(AppointmentEfficiencyService);

  // State Signals
  loading = signal(true);
  error = signal<string | null>(null);

  noShow = signal<NoShowRateResponse | null>(null);
  cancellation = signal<CancellationRateResponse | null>(null);

  // Constants for the circular SVG Doughnut chart (Radius 45, Circumference ≈ 282.743)
  readonly circumferenceDoughnut = 2 * Math.PI * 45; // 282.743

  // Computed signal for No-Show Rate stroke offset
  // Calculates the offset needed to draw the 'No-Show' portion of the Doughnut.
  noShowOffset = computed(() => {
    const rate = this.noShow()?.noShowRate || 0;
    // Formula: Circumference - (Rate / 100) * Circumference
    const offset = this.circumferenceDoughnut - (Math.min(rate, 100) / 100) * this.circumferenceDoughnut;
    return offset;
  });

  // Computed signal for Cancellation Rate stroke offset
  // Calculates the offset needed to draw the 'Cancellation' portion of the Doughnut.
  cancelOffset = computed(() => {
    const rate = this.cancellation()?.cancellationRate || 0;
    const offset = this.circumferenceDoughnut - (Math.min(rate, 100) / 100) * this.circumferenceDoughnut;
    return offset;
  });

  ngOnInit(): void {
    this.fetchKpiData();
  }

  fetchKpiData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Fetch No-Show Rate
    this.service.getNoShowRate().subscribe({
      next: data => this.noShow.set(data),
      error: err => {
        this.error.set(err.message || 'Failed to fetch No-Show Rate.');
        this.loading.set(false); // Stop loading if one fails
      },
      complete: () => {
        // Only set loading to false after the second call completes successfully or errors out
        this.checkIfComplete();
      }
    });

    // Fetch Cancellation Rate
    this.service.getCancellationRate().subscribe({
      next: data => this.cancellation.set(data),
      error: err => {
        this.error.set(err.message || 'Failed to fetch Cancellation Rate.');
        this.loading.set(false); // Stop loading if one fails
      },
      complete: () => {
        this.checkIfComplete();
      }
    });
  }

  // Simple checker to see if both signals have received data (or if an error occurred)
  private checkIfComplete(): void {
    // Only set loading to false if both data signals have received a value
    if (this.noShow() !== null && this.cancellation() !== null) {
      this.loading.set(false);
    }
    // Note: If an error occurs, loading is set to false in the error handler above.
  }
}

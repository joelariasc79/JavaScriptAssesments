import { Component, signal, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { ClinicalEncounterPopulated } from '../../../../../clinical-encounter/models/clinical-encounter.model';
import { MedicalRecordService } from '../../services/medical-record.service';
import { ClinicalEncounterStatus } from '../../../../../clinical-encounter/models/enums';

@Component({
  selector: 'app-medical-record-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './medical-record-list.component.html',
  styleUrls: ['./medical-record-list.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalRecordListComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private medicalRecordService = inject(MedicalRecordService);
  private router = inject(Router);

  private subscriptions = new Subscription();

  // Signals for state management
  clinicalEncounters = signal<ClinicalEncounterPopulated[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  private subscription = new Subscription();

  ngOnInit() {
    this.fetchClinicalEncounters();
  }

  fetchClinicalEncounters() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    // Assuming getClinicalEncounters returns an Observable<ClinicalEncounterPopulated[]>
    const sub = this.medicalRecordService.getPatientEncounters().subscribe({
      next: (data) => {
        this.clinicalEncounters.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching clinical encounters:', err);
        this.error.set(true);
        this.message.set(err.message || 'Failed to load clinical encounters.');
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  onViewClick(encounter: ClinicalEncounterPopulated) {
    this.router.navigate(['/patient/medical-record-view', encounter._id]);
  }

  /**
   * Helper function to get the appropriate status badge color classes.
   * This is required by the HTML template's [ngClass] binding.
   */
  getStatusClasses(status: ClinicalEncounterStatus | string): string {
    // Ensure the status is treated as uppercase for reliable comparison
    const s = (status as ClinicalEncounterStatus || ClinicalEncounterStatus.Draft).toUpperCase();

    switch (s) {
      case 'FINAL':
        return 'bg-green-100 text-green-800 border-green-400';
      case 'AMENDED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-400';
      case 'DRAFT':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-400';
    }
  }

    ngOnDestroy(): void {
      // Cleanup subscriptions to prevent memory leaks
      this.subscriptions.unsubscribe();
    }

}

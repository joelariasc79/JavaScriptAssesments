import {Component, signal, OnInit, OnDestroy, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; // Import Router
import { ClinicalEncounterPopulated } from '../../models/clinical-encounter.model';
import { ClinicalEncounterService } from '../../services/clinical-encounter.service';

@Component({
  selector: 'app-clinical-encounter-list',
  imports: [CommonModule],
  templateUrl: './clinical-encounter-list.component.html',
  styleUrl: './clinical-encounter-list.component.sass'
})
export class ClinicalEncounterListComponent {
  // Dependency Injection using inject() for cleaner code
  private clinicalEncounterService = inject(ClinicalEncounterService);
  private router = inject(Router);

  private subscriptions = new Subscription();

  // Signals for state management
  clinicalEncounters = signal<ClinicalEncounterPopulated[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  ngOnInit() {
    this.fetchClinicalEncounters();
  }

  /**
   * Fetches the list of clinical encounters from the service.
   * Assumes the service handles population of 'doctor' and 'patient' fields.
   */
  fetchClinicalEncounters() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    // Assuming getClinicalEncounters returns an Observable<ClinicalEncounterPopulated[]>
    const sub = this.clinicalEncounterService.getCurrentHospitalAllEncounters().subscribe({
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

  /**
   * Navigates to the clinical encounter creation form.
   */
  onCreateClick() {
    this.router.navigate(['/clinical-encounter/create']);
  }

  /**
   * Navigates to the details page for a specific encounter.
   * @param encounter The full populated encounter object.
   */
  onUpdateClick(encounter: ClinicalEncounterPopulated) {
    // Navigate to a details/view route, passing the encounter ID as a parameter

    console.log("encounter update", encounter);
    this.router.navigate(['/doctor/clinical-encounter-details', encounter._id]);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }
}

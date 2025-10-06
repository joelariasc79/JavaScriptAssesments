import { Component, signal, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Specialty } from '../../models/specialty.model';
import { Disease } from '../../models/disease.model';
import { DiseaseService } from '../../services/disease.service';
import { SpecialtyService } from '../../services/specialty.service';



@Component({
  selector: 'app-disease-list',
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './disease-list.component.html',
  styleUrl: './disease-list.component.sass'
})
export class DiseaseListComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();

  constructor(
    private diseaseService: DiseaseService,
    private router: Router
  ) { }

  diseases = signal<Disease[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');

  ngOnInit() {
    this.fetchDiseases();
  }

  fetchDiseases() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    const sub = this.diseaseService.getAllDiseases().subscribe({
      next: (data) => {
        this.diseases.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err.message || 'Failed to load diseases.');
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  onCreateClick() {
    this.router.navigate(['/disease-registration']);
  }

  onUpdateClick(disease: Disease) {
    this.router.navigate(['/disease-registration'], { state: { disease } });
  }

  onDeleteClick(diseaseId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    const sub = this.diseaseService.deleteDisease(diseaseId).subscribe({
      next: () => {
        this.diseases.update(diseases => diseases.filter(p => p._id !== diseaseId));
        this.message.set('Disease successfully removed!');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        const errorMessage = err.error?.message || err.message || 'Failed to delete disease.';
        this.message.set(errorMessage);
        this.loading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

}

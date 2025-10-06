import { Component, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalService } from '../../services/hospital.service';
import { Hospital } from '../../models/hospital.model';


@Component({
  selector: 'app-hospital-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-dashboard.component.html',
  styleUrl: './hospital-dashboard.component.sass'
})
export class HospitalDashboardComponent implements OnInit {
  private hospitalService = new HospitalService();

  hospitals = signal<Hospital[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');
  isUpdateMode = signal(false);

  newHospital: Hospital = {
    name: '',
    address: { street: '', city: '', state: '' },
    type: '',
    contact_number: '',
    charges: 0,
  };

  ngOnInit() {
    this.fetchHospitals();
  }

  async fetchHospitals() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    try {
      const data = await this.hospitalService.getHospitals();
      this.hospitals.set(data);
    } catch (err: any) {
      this.error.set(true);
      this.message.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  submitHospital() {
    if (this.isUpdateMode()) {
      this.updateHospital();
    } else {
      this.addHospital();
    }
  }

  async addHospital() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    try {
      const createdHospital = await this.hospitalService.createHospital(this.newHospital);
      this.hospitals.update(hospitals => [...hospitals, createdHospital]);
      this.message.set('Hospital created successfully!');
      this.resetForm();
    } catch (err: any) {
      this.error.set(true);
      this.message.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async updateHospital() {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    try {
      const updatedHospital = await this.hospitalService.updateHospital(this.newHospital);
      this.hospitals.update(hospitals =>
        hospitals.map(h => (h._id === updatedHospital._id ? updatedHospital : h))
      );
      this.message.set('Hospital updated successfully!');
      this.cancelUpdate();
    } catch (err: any) {
      this.error.set(true);
      this.message.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async onDeleteClick(hospitalId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');
    try {
      await this.hospitalService.deleteHospital(hospitalId);
      this.hospitals.update(hospitals => hospitals.filter(h => h._id !== hospitalId));
      this.message.set('Hospital deleted successfully!');
    } catch (err: any) {
      this.error.set(true);
      this.message.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  onUpdateClick(hospital: Hospital) {
    this.newHospital = { ...hospital };
    this.isUpdateMode.set(true);
  }

  cancelUpdate() {
    this.isUpdateMode.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.newHospital = {
      name: '',
      address: { street: '', city: '', state: '' },
      type: '',
      contact_number: '',
      charges: 0,
    };
  }
}

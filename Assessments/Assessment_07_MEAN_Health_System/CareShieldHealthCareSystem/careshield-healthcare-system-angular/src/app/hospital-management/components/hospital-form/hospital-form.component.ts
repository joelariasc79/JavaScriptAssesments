import { Component, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalService } from '../../services/hospital.service';
import { Hospital } from '../../models/hospital.model';
import { US_STATES } from '../../../shared/constants';
import { HospitalType } from '../../../shared/enums';
import { MaskedInputDirective } from '../../../shared/directives/masked-input.directive' // Import the new directive


@Component({
  selector: 'app-hospital-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MaskedInputDirective],
  templateUrl: './hospital-form.component.html',
  styleUrl: './hospital-form.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalFormComponent implements OnInit {
  // Correctly initialized as a private property with the new keyword
  // The service should be injected, not instantiated directly.
  // We'll assume the constructor is updated for this.
  // private hospitalService: HospitalService;
  constructor(private hospitalService: HospitalService) {}

  hospitals = signal<Hospital[]>([]);
  loading = signal(false);
  error = signal(false);
  message = signal('');
  isUpdateMode = signal(false);
  formSubmitted = signal(false);

  // Using the imported constants and enums
  hospitalTypes = Object.values(HospitalType);
  usStates = US_STATES;

  newHospital = signal<Hospital>({
    name: '',
    address: { street: '', city: '', state: '' },
    type: '',
    contact_number: '',
    charges: 0,
  });

  isNameValid = computed(() => this.newHospital().name.length > 0);
  isStreetValid = computed(() => this.newHospital().address.street.length > 0);
  isCityValid = computed(() => this.newHospital().address.city.length > 0);
  isStateValid = computed(() => this.newHospital().address.state.length > 0);

  // Now we check if the type is a valid member of the enum
  isTypeValid = computed(() => Object.values(HospitalType).includes(this.newHospital().type as HospitalType));

  isPhoneValid = computed(() => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(this.newHospital().contact_number);
  });
  areChargesValid = computed(() => this.newHospital().charges > 0);

  isFormValid = computed(() => {
    return (
      this.isNameValid() &&
      this.isStreetValid() &&
      this.isCityValid() &&
      this.isStateValid() &&
      this.isTypeValid() &&
      this.isPhoneValid() &&
      this.areChargesValid()
    );
  });

  ngOnInit() {
    this.fetchHospitals();
  }

  // Method to update a simple property on the signal
  updateField(fieldName: keyof Hospital, event: any) {
    this.newHospital.update(h => ({
      ...h,
      [fieldName]: event
    }));
  }

  // Method to update a nested address property on the signal
  updateAddressField(fieldName: keyof Hospital['address'], event: any) {
    this.newHospital.update(h => ({
      ...h,
      address: {
        ...h.address,
        [fieldName]: event
      }
    }));
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
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.error.set(true);
      this.message.set('Please correct the validation errors in the form.');
      return;
    }
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
      const createdHospital = await this.hospitalService.createHospital(this.newHospital());
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
      const updatedHospital = await this.hospitalService.updateHospital(this.newHospital());
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
    this.newHospital.set({ ...hospital });
    this.isUpdateMode.set(true);
  }

  cancelUpdate() {
    this.isUpdateMode.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.newHospital.set({
      name: '',
      address: { street: '', city: '', state: '' },
      type: HospitalType.Government, // Reset to the default enum value
      contact_number: '',
      charges: 0,
    });
    this.formSubmitted.set(false);
  }
}


// import { Component, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { HospitalService } from '../../services/hospital.service';
// import { Hospital } from '../../hospital.models';
//
// @Component({
//   selector: 'app-hospital-form',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './hospital-form.component.html',
//   styleUrl: './hospital-form.component.sass',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class HospitalFormComponent implements OnInit {
//   private hospitalService = new HospitalService();
//
//   hospitals = signal<Hospital[]>([]);
//   loading = signal(false);
//   error = signal(false);
//   message = signal('');
//   isUpdateMode = signal(false);
//   formSubmitted = signal(false);
//
//   hospitalTypes = ['Government', 'Private', 'Other'];
//   usStates = [
//     'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
//     'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
//     'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
//     'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
//     'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
//   ];
//
//   newHospital = signal<Hospital>({
//     name: '',
//     address: { street: '', city: '', state: '' },
//     type: '',
//     contact_number: '',
//     charges: 0,
//   });
//
//   isNameValid = computed(() => this.newHospital().name.length > 0);
//   isStreetValid = computed(() => this.newHospital().address.street.length > 0);
//   isCityValid = computed(() => this.newHospital().address.city.length > 0);
//   isStateValid = computed(() => this.newHospital().address.state.length > 0);
//   isTypeValid = computed(() => this.newHospital().type.length > 0);
//   isPhoneValid = computed(() => {
//     const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
//     return phoneRegex.test(this.newHospital().contact_number);
//   });
//   areChargesValid = computed(() => this.newHospital().charges > 0);
//
//   isFormValid = computed(() => {
//     return (
//       this.isNameValid() &&
//       this.isStreetValid() &&
//       this.isCityValid() &&
//       this.isStateValid() &&
//       this.isTypeValid() &&
//       this.isPhoneValid() &&
//       this.areChargesValid()
//     );
//   });
//
//   ngOnInit() {
//     this.fetchHospitals();
//   }
//
//   // Method to update a simple property on the signal
//   updateField(fieldName: keyof Hospital, event: any) {
//     this.newHospital.update(h => ({
//       ...h,
//       [fieldName]: event
//     }));
//   }
//
//   // Method to update a nested address property on the signal
//   updateAddressField(fieldName: keyof Hospital['address'], event: any) {
//     this.newHospital.update(h => ({
//       ...h,
//       address: {
//         ...h.address,
//         [fieldName]: event
//       }
//     }));
//   }
//
//   async fetchHospitals() {
//
//     this.loading.set(true);
//     this.error.set(false);
//     this.message.set('');
//
//     try {
//       const data = await this.hospitalService.getHospitals();
//       this.hospitals.set(data);
//     } catch (err: any) {
//       this.error.set(true);
//       this.message.set(err.message);
//     } finally {
//       this.loading.set(false);
//     }
//   }
//
//   submitHospital() {
//     this.formSubmitted.set(true);
//
//     if (!this.isFormValid()) {
//       this.error.set(true);
//       this.message.set('Please correct the validation errors in the form.');
//       return;
//     }
//
//     if (this.isUpdateMode()) {
//       this.updateHospital();
//     } else {
//       this.addHospital();
//     }
//   }
//
//   async addHospital() {
//     this.loading.set(true);
//     this.error.set(false);
//     this.message.set('');
//     try {
//       const createdHospital = await this.hospitalService.createHospital(this.newHospital());
//       this.hospitals.update(hospitals => [...hospitals, createdHospital]);
//       this.message.set('Hospital created successfully!');
//       this.resetForm();
//     } catch (err: any) {
//       this.error.set(true);
//       this.message.set(err.message);
//     } finally {
//       this.loading.set(false);
//     }
//   }
//
//   async updateHospital() {
//     this.loading.set(true);
//     this.error.set(false);
//     this.message.set('');
//     try {
//       const updatedHospital = await this.hospitalService.updateHospital(this.newHospital());
//       this.hospitals.update(hospitals =>
//         hospitals.map(h => (h._id === updatedHospital._id ? updatedHospital : h))
//       );
//       this.message.set('Hospital updated successfully!');
//       this.cancelUpdate();
//     } catch (err: any) {
//       this.error.set(true);
//       this.message.set(err.message);
//     } finally {
//       this.loading.set(false);
//     }
//   }
//
//   async onDeleteClick(hospitalId: string) {
//     this.loading.set(true);
//     this.error.set(false);
//     this.message.set('');
//     try {
//       await this.hospitalService.deleteHospital(hospitalId);
//       this.hospitals.update(hospitals => hospitals.filter(h => h._id !== hospitalId));
//       this.message.set('Hospital deleted successfully!');
//     } catch (err: any) {
//       this.error.set(true);
//       this.message.set(err.message);
//     } finally {
//       this.loading.set(false);
//     }
//   }
//
//   onUpdateClick(hospital: Hospital) {
//     this.newHospital.set({ ...hospital });
//     this.isUpdateMode.set(true);
//   }
//
//   cancelUpdate() {
//     this.isUpdateMode.set(false);
//     this.resetForm();
//   }
//
//   private resetForm() {
//     this.newHospital.set({
//       name: '',
//       address: { street: '', city: '', state: '' },
//       type: '',
//       contact_number: '',
//       charges: 0,
//     });
//     this.formSubmitted.set(false);
//   }
// }

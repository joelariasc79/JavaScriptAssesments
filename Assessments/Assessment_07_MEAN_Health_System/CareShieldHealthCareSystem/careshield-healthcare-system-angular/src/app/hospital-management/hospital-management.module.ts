import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HospitalManagementRoutingModule } from './hospital-management-routing.module';
import { HospitalFormComponent } from './components/hospital-form/hospital-form.component';
import { HospitalService } from './services/hospital.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HospitalManagementRoutingModule,
    HospitalFormComponent
  ],
  providers: [
    HospitalService
  ]
})
export class HospitalManagementModule { }

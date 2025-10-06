import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HospitalRoutingModule } from './hospital-routing.module';
import { HospitalManagementModule } from '../hospital-management/hospital-management.module';
import { HospitalService } from '../hospital-management/services/hospital.service';

import { PatientManagementModule } from '../patient-management/patient-management.module';
import { PatientService } from '../patient-management/services/patient.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HospitalRoutingModule,
    HospitalManagementModule,
    PatientManagementModule
  ],
  providers: [
    HospitalService,
    PatientService
  ]
})
export class HospitalModule { }

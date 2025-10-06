import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorManagementRoutingModule } from './doctor-management-routing.module';
import { DoctorListComponent } from './components/doctor-list/doctor-list.component';
import { DoctorFormComponent } from './components/doctor-form/doctor-form.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DoctorManagementRoutingModule,
    HttpClientModule,
    DoctorListComponent,
    DoctorFormComponent
  ]
})
export class DoctorManagementModule { }

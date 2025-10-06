import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiseaseManagementRoutingModule } from './disease-management-routing.module';
import { DiseaseListComponent } from './components/disease-list/disease-list.component';
import { DiseaseFormComponent } from './components/disease-form/disease-form.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    DiseaseManagementRoutingModule,
    DiseaseListComponent,
    DiseaseFormComponent
  ]
})
export class DiseaseManagementModule { }

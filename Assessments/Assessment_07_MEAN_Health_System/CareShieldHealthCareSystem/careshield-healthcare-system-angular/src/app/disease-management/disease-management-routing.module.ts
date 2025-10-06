import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiseaseListComponent } from './components/disease-list/disease-list.component';
import { DiseaseFormComponent } from './components/disease-form/disease-form.component';


const routes: Routes = [{
  path: 'disease-dashboard',
  component: DiseaseListComponent
},
  {
    path: 'disease-registration',
    component: DiseaseFormComponent
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiseaseManagementRoutingModule { }

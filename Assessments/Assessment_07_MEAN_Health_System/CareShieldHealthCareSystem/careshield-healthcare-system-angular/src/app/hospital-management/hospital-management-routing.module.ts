import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HospitalFormComponent } from './components/hospital-form/hospital-form.component';

const routes: Routes = [
  {
    path: 'hospital-dashboard',
    component: HospitalFormComponent
  },
  {
    path: '',
    redirectTo: 'hospital-management',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HospitalManagementRoutingModule { }

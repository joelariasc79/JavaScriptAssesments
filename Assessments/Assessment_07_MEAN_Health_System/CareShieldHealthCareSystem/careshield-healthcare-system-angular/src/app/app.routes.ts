import { Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './auth/components/login/login.component';
// import { SignupComponent } from './auth/signup/signup.component';

export const routes: Routes = [
  // Authentication Routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent
      }
      // ,
      // {
      //   path: 'signup',
      //   component: SignupComponent
      // }
    ]
  },
  // Main application routes, matching the login component's redirection logic
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'hospital-management',
    loadChildren: () => import('./hospital-management/hospital-management.module').then(m => m.HospitalManagementModule)
  },
  {
    path: 'patient-management',
    children: [
      {
        path: '', // This will match 'patient-management'
        loadComponent: () => import('./patient-management/components/patient-list/patient-list.component').then(m => m.PatientListComponent)
      }
    ]
  },
  {
    path: 'patient-registration',
    children: [
      {
        path: '', // This will match 'patient-management'
        loadComponent: () => import('./patient-management/components/patient-form/patient-form.component').then(m => m.PatientFormComponent)
      }
    ]
  },
  {
    path: 'doctor-management',
    children: [
      {
        path: '', // This will match 'patient-management'
        loadComponent: () => import('./doctor-management/components/doctor-list/doctor-list.component').then(m => m.DoctorListComponent)
      }
    ]
  },
  {
    path: 'doctor-registration',
    children: [
      {
        path: '',
        loadComponent: () => import('./doctor-management/components/doctor-form/doctor-form.component').then(m => m.DoctorFormComponent)
      }
    ]
  },
  {
    path: 'disease-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./disease-management/components/disease-list/disease-list.component').then(m => m.DiseaseListComponent)
      }
    ]
  },
  {
    path: 'disease-registration',
    children: [
      {
        path: '',
        loadComponent: () => import('./disease-management/components/disease-form/disease-form.component').then(m => m.DiseaseFormComponent)
      }
    ]
  },
  {
    path: 'patient/patient-screening-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/patient-screening-management/components/patient-screening-list/patient-screening-list.component').then(m => m.PatientScreeningListComponent)
      }
    ]
  },
  {
    path: 'patient/patient-screening-registration',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/patient-screening-management/components/patient-screening-form/patient-screening-form.component').then(m => m.PatientScreeningFormComponent)
      }
    ]
  },
  // Redirect to the login page as the default route
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  }
];

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations()
  ]
};

import { Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './auth/components/login/login.component';
// import { SignupComponent } from './auth/signup/signup.component';

import { PaymentFormComponent } from './payment/components/payment-form/payment-form.component';
import {
  DoctorFeedbackResultComponent
} from './feedback/components/doctor/doctor-feedback-result/doctor-feedback-result.component';


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
  {
    path: 'patient/appointment/patient-appointment-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/patient-appointment-management/components/patient-appointment-list/patient-appointment-list.component').then(m => m.PatientAppointmentListComponent)
      }
    ]
  },
  {
    path: 'patient/appointment/patient-appointment-start',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/patient-appointment-management/components/patient-appointment-select-specialty-doctor/patient-appointment-select-specialty-doctor.component').then(m => m.PatientAppointmentSelectSpecialtyDoctorComponent)
      }
    ]
  },
  {
    path: 'patient/doctor-availability',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/patient-appointment-management/components/patient-appointment-doctor-availability/patient-appointment-doctor-availability.component').then(m => m.PatientAppointmentDoctorAvailabilityComponent)
      }
    ]
  },
  {
    path: 'patient/confirm-appointment',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/patient-appointment-management/components/patient-appointment-confirmation/patient-appointment-confirmation.component').then(m => m.PatientAppointmentConfirmationComponent)
      }
    ]
  },
  {
    path: 'payment/payment-form/:id',
    children: [
      {
        path: '',
        component: PaymentFormComponent
        // loadComponent: () => import('./payment/components/payment-form/payment-form.component').then(m => m.PaymentFormComponent)
      }
    ]
  },
  {
    path: 'patient/medical-record-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/medical-record/components/medical-record-list/medical-record-list.component').then(m => m.MedicalRecordListComponent)
      }
    ]
  },
  {
    path: 'patient/medical-record-view/:id',
    children: [
      {
        path: '',
        loadComponent: () => import('./patient/components/medical-record/components/medical-record-view/medical-record-view.component').then(m => m.MedicalRecordViewComponent)
      }
    ]
  },
  {
    path: 'doctor/clinical-encounter-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./clinical-encounter/components/clinical-encounter-list/clinical-encounter-list.component').then(m => m.ClinicalEncounterListComponent)
      }
    ]
  },
  {
    path: 'doctor/clinical-encounter-details/:id',
    children: [
      {
        path: '',
        loadComponent: () => import('./clinical-encounter/components/clinical-encounter-form/clinical-encounter-form.component').then(m => m.ClinicalEncounterFormComponent)
      }
    ]
  },
  {
    path: 'hospital/medical-record-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./hospital/components/medical-record/components/medical-record-list/medical-record-list.component').then(m => m.MedicalRecordListComponent)
      }
    ]
  },
  {
    path: 'hospital/medical-record-view/:id',
    children: [
      {
        path: '',
        loadComponent: () => import('./hospital/components/medical-record/components/medical-record-view/medical-record-view.component').then(m => m.MedicalRecordViewComponent)
      }
    ]
  },
  {
    path: 'feedback/patient/feedback-management',
    children: [
      {
        path: '',
        loadComponent: () => import('./feedback/components/patient/doctor-feedback-list/doctor-feedback-list.component').then(m => m.DoctorFeedbackListComponent)
      }
    ]
  },
  {
    path: 'feedback/patient/add-feedback',
    children: [
      {
        path: '',
        loadComponent: () => import('./feedback/components/patient/doctor-feedback-form/doctor-feedback-form.component').then(m => m.DoctorFeedbackFormComponent)
      }
    ]
  },
  {
    path: 'feedback/doctor/feedback-results',
    children: [
      {
        path: '',
        loadComponent: () => import('./feedback/components/doctor/doctor-feedback-result/doctor-feedback-result.component').then(m => m.DoctorFeedbackResultComponent)
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

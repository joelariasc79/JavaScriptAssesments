import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

// Make sure these are the correct paths to your functional guards/interceptors
import { authGuard } from './core/guards/auth.guard';
import { authInterceptor } from './core/http-interceptors/auth.interceptor';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    // This is the correct way to provide the functional guard
    // The functional guard is used directly in the route definition, not here.
    // The provider array for guards is not needed in the module.

    // This is the correct way to provide the functional interceptor
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
})
export class CoreModule { }

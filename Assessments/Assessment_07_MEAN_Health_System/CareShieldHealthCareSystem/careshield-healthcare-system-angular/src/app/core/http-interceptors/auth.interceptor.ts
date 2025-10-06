import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken(); // Gets token from signal/localStorage

  if (token) {
    // Clone the request and set the Authorization header
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  // If no token, just pass the original request
  return next(req);
};


// import { HttpInterceptorFn } from '@angular/common/http';
//
// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req);
// };

import {Injectable, signal, Inject, PLATFORM_ID} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import {environment} from '../../../environments/environment'; // For SSR compatibility
// import { AuthResponse } from '../auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL_AUTH = `${environment.apiUrl}/auth`;

  // --- Platform and Initialization Helpers ---

  constructor(
    private http: HttpClient,
    // Inject PLATFORM_ID to determine the execution environment for SSR safety
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // When the service is instantiated, safely load the token and patient data.
    this.initializeState();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private initializeState(): void {
    if (this.isBrowser()) {
      const token = localStorage.getItem('token');

      // 💡 Paso de Debugging
      console.log('Token leído en initializeState:', token ? 'Token presente' : 'Token ausente');

      this.tokenSignal.set(token);
      // ...
    }
  }

  // --- Signals for Application State (Source of Truth) ---

  // Stores the JWT token for authentication
  private tokenSignal = signal<string | null>(null);

  public currentUserId = signal<string | null>(null);

  // Stores the currently logged-in patient's details
  public currentUserName = signal<string | null>(null);
  public currentUserRole = signal<string | null>(null);

  // Public getter for token
  getToken(): string | null {
    return this.tokenSignal();
  }

  getUserId(): string | null {
    return this.currentUserId();
  }

  // --- Core Authentication Methods ---

  /**
   * Handles the initial login attempt, stores the token, and updates patient signals.
   */
  login(usernameOrEmail: string, password: string): Observable<AuthResponse> {
    const payload = { usernameOrEmail, password };
    return this.http.post<AuthResponse>(`${this.API_URL_AUTH}/login`, payload).pipe(
      tap(response => {
        // 1. Store the token (SSR Safe)
        if (this.isBrowser()) {
          localStorage.setItem('token', response.token);
        }
        this.tokenSignal.set(response.token);

        // 2. Set patient details from the response
        this.currentUserId.set(response.user.userId);
        this.currentUserName.set(response.user.username);
        this.currentUserRole.set(response.user.role);
      }),
      catchError(error => {
        // Clear state on failed login
        this.logout();
        return throwError(() => new Error(error.error.message || 'Login failed.'));
      })
    );
  }

  /**
   * Handles the second step for staff: selecting a specific hospital.
   * * ➡️ ACTUALIZACIÓN: Se espera que el servidor devuelva una nueva respuesta (AuthResponse)
   * con un token actualizado que incluye el hospital seleccionado y los permisos finales.
   */
  selectHospital(hospitalId: string): Observable<AuthResponse> {
    const payload = { hospitalId };
    // Se asume que el servidor devuelve AuthResponse con el nuevo token y usuario
    return this.http.post<AuthResponse>(`${this.API_URL_AUTH}/select-hospital`, payload).pipe(
      tap(response => {
        // 🛑 Cliente más robusto: Se comprueba la existencia de los datos críticos.
        if (!response || !response.token || !response.user) {
          console.error('SERVER CONTRACT VIOLATION: The select-hospital endpoint must return a new token and a full patient object.', response);
          // Si el servidor falla en el contrato, forzamos un error para detener el flujo de éxito.
          throw new Error('Server response missing required token or patient details after hospital selection.');
        }


        // 1. Almacenar el NUEVO token (SSR Safe)
        if (this.isBrowser()) {
          localStorage.setItem('token', response.token);
        }
        this.tokenSignal.set(response.token);

        // 2. Actualizar los detalles del usuario con la nueva información
        this.currentUserId.set(response.user.userId);
        this.currentUserName.set(response.user.username);
        this.currentUserRole.set(response.user.role);

        console.log(`Hospital ID ${hospitalId} seleccionado. Nuevo token y rol actualizados.`);
      }),
      catchError(error => {
        // 🛑 FIX: Acceso seguro al mensaje de error usando encadenamiento opcional.
        console.error('Error al seleccionar hospital:', error);
        const errorMessage = error.error?.message || error.message || 'Hospital selection failed.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Clears all session state and navigates to the login screen.
   */
  logout(): void {
    // 1. Clear token from local storage (SSR Safe)
    if (this.isBrowser()) {
      localStorage.removeItem('token');
    }

    // 2. Clear all signals
    this.currentUserId.set(null);
    this.tokenSignal.set(null);
    this.currentUserName.set(null);
    this.currentUserRole.set(null);
  }
}

// --- Interface Definitions (typically in auth.models.ts) ---

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    userId: string;
    username: string;
    name: string;
    role: string;
    hospitalIds: string[];
  };
}

import {ChangeDetectionStrategy, Component, computed, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {Router, RouterModule} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.model';
import { Hospital } from '../../../hospital-management/models/hospital.model';
import { HospitalService } from '../../../hospital-management/services/hospital.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  username = signal('');
  password = signal('');
  hospitalId = signal('');
  hospitals = signal<Hospital[]>([]);

  // Signals to manage the new login flow
  showHospitalModal = signal(false);
  userHospitals = signal<string[]>([]); // To store the hospitalIds from the login response

  loading = signal(false);
  message = signal('');
  error = signal(false);
  formSubmitted = signal(false);

  // New computed signal to filter the hospitals for the modal
  filteredHospitals = computed(() => {
    const allHospitals = this.hospitals();
    const userHospitalIds = this.userHospitals();

    if (!userHospitalIds || userHospitalIds.length === 0) {
      return [];
    }

    return allHospitals.filter(hospital => hospital._id && userHospitalIds.includes(hospital._id));
  });

  constructor(
    private authService: AuthService,
    private hospitalService: HospitalService,
    private router: Router
  ) {}

  isAdmin: boolean = false;

  isUsernameOrEmailValid = computed(() => this.username().length > 0);
  isPasswordValid = computed(() => this.password().length > 0);
  isFormValid = computed(() => this.isUsernameOrEmailValid() && this.isPasswordValid());

  ngOnInit() {
    this.fetchHospitals();
  }

  // Updated logic for the initial login attempt.
  // This now only sends the username and password.
  submitLogin() {
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.error.set(true);
      this.message.set('Please enter your username/email and password.');
      return;
    }

    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    // Call the login service with only username and password
    this.authService.login(this.username(), this.password()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.error.set(false);

        // Check the user's role to determine the next step
        if (response.user.role === 'admin') {
          this.message.set('Admin login successful! Redirecting...');
          // Redirect admins directly
          this.router.navigate(['/hospital-management']);
        } else if (response.user.role === 'hospital_admin' || response.user.role === 'doctor'  || response.user.role === 'patient') {
          // For hospital staff, show the hospital selection modal
          this.userHospitals.set(response.user.hospitalIds);
          this.showHospitalModal.set(true);
        } else {
          // Handle other roles or a successful login that doesn't need redirection here
          this.message.set('Login successful! Redirecting...');
          this.router.navigate(['/hospital-management']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(true);
        this.message.set(err.message || 'An unexpected error occurred.');
      }
    });
  }

  // New method to handle the second step: hospital selection.
  selectHospital(hospitalId: string) {
    this.loading.set(true);
    this.error.set(false);
    this.message.set('');

    // Assume AuthService has a new method for this.
    // The user's token is typically stored in the service after the initial login.
    this.authService.selectHospital(hospitalId).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.error.set(false);
        this.message.set('Hospital selected successfully! Redirecting...');
        this.router.navigate(['/hospital-management']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(true);
        this.message.set(err.message || 'An unexpected error occurred during hospital selection.');
      }
    });
  }

  fetchHospitals() {
    this.hospitalService.getHospitals().then(
      (data) => {
        this.hospitals.set(data);
      }).catch((err) => {
      console.error('Error fetching hospitals:', err);
    });
  }

}

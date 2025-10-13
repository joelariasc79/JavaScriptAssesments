import {Component, OnInit, ChangeDetectionStrategy, signal, inject, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    RouterLinkActive,
    RouterLink,
    CommonModule
  ],
  styleUrls: ['./header.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {

  // Injected services
  private router = inject(Router);
  // Using the MockAuthService for dependency injection
  private authService = inject(AuthService);

  // Simulate patient role and logged-in patient with signals
  userRole = this.authService.currentUserRole;
  loggedInUser = this.authService.currentUserName;

  isLoggedIn = computed(() => this.loggedInUser() !== null && this.userRole() !== null);


  ngOnInit(): void {
    // Initialization logic
  }

  // // Renamed the method to onLogout for event handling consistency
  // onLogout(): void {
  //   // 1. Call your authentication service's logout method (using mock for now)
  //   this.authService.logout();
  //
  //   // 2. Clear local patient state signals
  //   this.userRole.set(null);
  //   this.loggedInUser.set(null);
  //
  //   // 3. Navigate the patient to the login page
  //   this.router.navigate(['/login']);
  // }

  onLogout(): void {
    // 1. Call your authentication service's logout method
    this.authService.logout();

    // The component's signals (userRole, loggedInUser) automatically update
    // because they are bound to the AuthService signals.

    // 2. Navigate the patient to the login page
    this.router.navigate(['/auth/login']); // Assuming '/auth/login' is the correct route
  }

  // This method now serves as a local state manipulator (for testing)
  // but it does NOT interact with the real AuthService state.
  changeRole(event: Event) {
    const role = (event.target as HTMLSelectElement).value;

    // ⚠️ WARNING: In a production app, you would dispatch an action or
    // call a service to change the role, not set local signals directly.
    if (role === 'none') {
      this.userRole.set(null);
      this.loggedInUser.set(null);
    } else {
      this.userRole.set(role);
      this.loggedInUser.set('John Doe');
    }
  }
}

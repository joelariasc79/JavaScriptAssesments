import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy } from '@angular/core';
import { catchError, throwError } from 'rxjs';


interface Hospital {
  _id?: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
    country?: string;
  };
  type: string;
  contact_number: string;
  charges: number;
  is_approved?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.sass'
})
export class AdminDashboardComponent {

}


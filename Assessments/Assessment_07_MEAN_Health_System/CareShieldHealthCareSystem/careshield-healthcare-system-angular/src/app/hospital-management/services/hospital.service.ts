import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Hospital } from '../models/hospital.model';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common'; // 1. Added import for SSR check

@Injectable({
  providedIn: 'root'
})
export class HospitalService {

  private readonly API_URL = `${environment.apiUrl}/hospitals`;
  private isBrowser: boolean; // 2. Property to hold browser environment status

  constructor(
    // 3. Inject PLATFORM_ID to determine execution environment
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); // 4. Set isBrowser status
  }

  // NOTE: Removed private readonly MOCK_AUTH_TOKEN.

  private getAuthHeaders() {
    let token = '';

    // 5. Use the SSR-safe check and retrieve the 'token' from localStorage
    if (this.isBrowser) {
      token = localStorage.getItem('token') || '';
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getHospitals(): Promise<Hospital[]> {
    try {

      // Using fetch API, which works well with async/await
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hospitals.');
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  }

  async createHospital(hospital: Hospital): Promise<Hospital> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hospital)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create hospital.');
      }

      // Assuming the response body contains the created hospital object
      return data.hospital;

    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }

  }

  // New method for updating a hospital
  async updateHospital(hospital: Hospital): Promise<Hospital> {
    try {

      const response = await fetch(`${this.API_URL}/${hospital._id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hospital)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update hospital.');
      }

      // Assuming the response body contains the updated hospital object
      return data.hospital;

    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  }

  async deleteHospital(hospitalId: string): Promise<void> {

    try {
      const response = await fetch(`${this.API_URL}/${hospitalId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete hospital.');
      }

    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }

  }
}

import { Injectable } from '@angular/core';
import { Hospital } from '../models/hospital.model';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {

  constructor() { }

  private readonly BASE_URL = 'http://localhost:9200/api/hospitals';
  // IMPORTANT: Replace this with a valid token from your backend for testing.
  private readonly MOCK_AUTH_TOKEN = 'YOUR_MOCK_AUTH_TOKEN_HERE';

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.MOCK_AUTH_TOKEN}`
    };
  }

  async getHospitals(): Promise<Hospital[]> {
    try {
      const response = await fetch(this.BASE_URL, {
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
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hospital)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create hospital.');
      }
      return data.hospital;
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  }

  // New method for updating a hospital
  async updateHospital(hospital: Hospital): Promise<Hospital> {
    try {
      const response = await fetch(`${this.BASE_URL}/${hospital._id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hospital)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update hospital.');
      }
      return data.hospital;
    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  }

  // New method for deleting a hospital
  async deleteHospital(hospitalId: string): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${hospitalId}`, {
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

import {inject, Injectable} from '@angular/core'; // injectable decorator makes the class available for dependency injection
import { HttpClient } from '@angular/common/http'; // HttpClient is imported to make HTTP calls
// This is is for the other way to add the hhtp client
// import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs'; // Observable is imported to handle asynchronous data streams

@Injectable({
  providedIn: 'root'
})

export class UserServices {
  // Another way to add the HttpClient
  // private http = inject(HttpClient);

  // private apiUrl = 'http://localhost:9000/user/api/users'; // Example API endpoint
  private apiUrl = 'http://localhost:9000/user'; // Base URL for the patient API
  constructor(private http: HttpClient) { }

  getUsers(): Observable<any> {
    // return this.http.get<any>(this.apiUrl); // Making a GET request to the API endpoint
    return this.http.get<any[]>(`${this.apiUrl}/api/users`);
  }

  createUser(userData: any) {
    return this.http.post<any>(`${this.apiUrl}/api/createuser`, userData);
  }


  // Service methods will be implemented here
  getData() : string[] {
    return ['Data1', 'Data2', 'Data3'];
  }

}

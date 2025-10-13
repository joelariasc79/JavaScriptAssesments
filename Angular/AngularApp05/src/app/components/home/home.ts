import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { UserServices } from '../../user-services';
import {FormsModule} from '@angular/forms'; // for ngSubmit, ngModel

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],  // for accessing *ngFor
  templateUrl: './home.html',
  styleUrl: './home.sass'
})

export class Home {

  items: string[] = [];

  users: any;
  newUser = { userName: '', password: '', street: '', mobile: '' };

  constructor(private userService: UserServices, private cdREf: ChangeDetectorRef) {
    this.fetchUsers();
    this.items = this.userService.getData(); //this service method is called to get data

    // this.userService.getUsers().subscribe((data) => {
    //   this.users = data;
    //   console.log('Users data fetched:', this.users);
    //   this.cdREf.detectChanges(); // Manually trigger change detection, If I don't have it, when I reload the page, users is not displayed
    // });
  }

  // Fetches users from the server and updates the view
  fetchUsers() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.cdREf.detectChanges(); // Trigger change detection to update the view
        console.log('Users data fetched:', this.users);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  // Adds a new patient to the server and refreshes the list
  addUser() {
    // Basic validation to ensure fields are not empty
    if (!this.newUser.userName || !this.newUser.password || !this.newUser.street || !this.newUser.mobile) {
      console.error('All fields are required.');
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
        // Clear the form after a successful creation
        this.newUser = {  userName: '', password: '', street: '', mobile: ''};
        // Fetch the updated list of users to display the new patient
        this.fetchUsers();
      },
      error: (err) => {
        if (err.status === 409) {
          console.error('User creation failed: User with this username already exists.');
        } else {
          console.error('An error occurred during patient creation:', err);
        }
      }
    });
  }






  count :number = 0;
  count2 :number = 0;
  @Input() inputCounter: number = 0;
  @Output() onCounterChange : EventEmitter<number> = new EventEmitter();

  @Input() numberData : number = 0;

  @Output() numberDataChange : EventEmitter<number> = new EventEmitter();

  handleIncrement() {
    // this.count2 = this.count2 + 1;
    // this.inputCounter = this.inputCounter + 1;
    // this.onCounterChange.emit(this.inputCounter);

    this.numberData = this.numberData + 1; // doing data manipulation
    this.numberDataChange.emit(this.numberData); // sending data back to parent component
  }

  handleDecrement() {
    // this.count2 = this.count2 - 1;
    // this.inputCounter = this.inputCounter - 1;
    // this.onCounterChange.emit(this.inputCounter);

    this.numberData = this.numberData - 1; // doing data manipulation
    this.numberDataChange.emit(this.numberData); // sending data back to parent component
  }

}






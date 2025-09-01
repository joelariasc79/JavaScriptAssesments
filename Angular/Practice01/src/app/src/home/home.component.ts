import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass'
})

export class HomeComponent {
  count: number = 0;
  count2: number = 0;

  handleIncrement() {
    this.count2 += 1;
  }

  handleDecrement() {
    this.count2 -= 1;
  }
}

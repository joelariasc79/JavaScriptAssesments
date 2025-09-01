import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HomeComponent} from './src/home/home.component';
import {Home2Component} from './src/home2/home2.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HomeComponent, Home2Component],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})

export class AppComponent {
  title = 'Practice01';
  inputCounter: number = 0;
  numberDataOutput: number | undefined;
}

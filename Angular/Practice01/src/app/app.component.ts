import {ChangeDetectionStrategy, Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './src/home/home.component';
import { Home2Component } from './src/home2/home2.component';
import { JoelComponent } from './joel/joel.component';
import { ReceiverComponent } from './receiver/receiver.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HomeComponent, Home2Component, JoelComponent, ReceiverComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
  // ,
  // changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent {
  title = 'Practice01';
  inputCounter: number = 0;
  numberDataOutput: number | undefined;
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FooterComponent} from './shared/components/footer/footer.component'; // Import the standalone HeaderComponent

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgbModule, RouterOutlet, HeaderComponent, FooterComponent], // Declare HeaderComponent in the imports array
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'care-shield-healthcare-system-angular';
  // title = 'health-system-app';
}

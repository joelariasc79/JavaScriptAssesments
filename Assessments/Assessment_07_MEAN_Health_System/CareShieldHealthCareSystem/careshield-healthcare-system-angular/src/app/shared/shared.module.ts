import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
  imports: [
    CommonModule,
    // Import standalone components to make them available
    HeaderComponent,
    FooterComponent
  ],
  exports: [
    // Export standalone components so consuming models can use them
    HeaderComponent,
    FooterComponent
  ]
})
export class SharedModule { }

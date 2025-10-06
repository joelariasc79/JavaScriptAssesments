import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTransferServiceService } from '../data-transfer-service.service';

@Component({
  selector: 'app-joel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './joel.component.html',
  styleUrl: './joel.component.sass'
})
export class JoelComponent {
  messageToSend: string = '';

  constructor(private dataTransferServiceService: DataTransferServiceService) {}

  sendMessage() {
    this.dataTransferServiceService.updateData(this.messageToSend);
    this.messageToSend = '';
  }
}

import { Component, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTransferServiceService } from '../data-transfer-service.service';

@Component({
  selector: 'app-receiver',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receiver.component.html',
  styleUrl: './receiver.component.sass'
})
export class ReceiverComponent {
  // A property to hold the computed signal
  receivedData = computed(() => 'Default'); // Initialize with a default value to avoid errors.

  constructor(private dataTransferServiceService: DataTransferServiceService) {
    // Correct way: Assign the signal in the constructor after the service is injected
    this.receivedData = this.dataTransferServiceService.data;
  }
}

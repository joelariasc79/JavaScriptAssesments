import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class DataTransferServiceService {

  // A writable signal to hold the data. This is the source of truth.
  private dataSignal: WritableSignal<string> = signal('Initial message from the service');

  // Expose a read-only computed value of the signal.
  // Components should read this to get the current value.
  public data = computed(() => this.dataSignal());

  // Method to update the data. Other components call this to send new data.
  public updateData(message: string): void {
    this.dataSignal.set(message);
  }

}

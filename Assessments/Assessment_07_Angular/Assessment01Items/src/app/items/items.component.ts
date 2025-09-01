import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Item} from './model/item.model';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-items',
  imports: [
    DecimalPipe
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.sass'
})
export class ItemsComponent {
  @Input({ required: true }) items!: Item[];
  @Output() addItemEvent = new EventEmitter<string>();

  addItem(value: string) {
    if (value.trim()) {
      this.addItemEvent.emit(value.trim());
    }
  }
}

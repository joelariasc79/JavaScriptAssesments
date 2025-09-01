import {Component, EventEmitter, Input, Output} from '@angular/core';



@Component({
  selector: 'app-home2',
  imports: [],
  templateUrl: './home2.component.html',
  styleUrl: './home2.component.sass'
})

export class Home2Component {
  count: number = 0;
  @Input() inputCounter: number = 0;
  @Output() onCounterChange: EventEmitter<number> = new EventEmitter<number>();
  @Input() numberData: number = 0;
  @Output() numberDataChange: EventEmitter<number> = new EventEmitter<number>();

  handleIncrement() {
    this.count += 1;
    this.onCounterChange.emit(this.count);
    this.numberData += 1;
    this.numberDataChange.emit(this.numberData);
  }

  handleDecrement() {
    this.count -= 1;
    this.onCounterChange.emit(this.count);
    this.numberData -= 1;
    this.numberDataChange.emit(this.numberData);
  }
}


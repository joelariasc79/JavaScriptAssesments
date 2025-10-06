import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appMaskedInput]',
  standalone: true,
})
export class MaskedInputDirective {
  @Input('appMaskedInput') mask!: string;

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value.replace(/\D/g, ''); // Remove all non-digits
    let maskedValue = '';
    let maskIndex = 0;
    let valueIndex = 0;

    while (maskIndex < this.mask.length && valueIndex < originalValue.length) {
      if (this.mask[maskIndex] === '#') {
        maskedValue += originalValue[valueIndex];
        valueIndex++;
      } else {
        maskedValue += this.mask[maskIndex];
      }
      maskIndex++;
    }

    // Set the input value to the new masked value
    input.value = maskedValue;

    // Use a custom event to notify ngModel of the change
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

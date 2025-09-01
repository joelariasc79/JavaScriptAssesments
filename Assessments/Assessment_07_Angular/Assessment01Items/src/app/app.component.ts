import {Component, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ItemsComponent} from './items/items.component';
import {Item} from './items/model/item.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ItemsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'Assessment01Items';

  shopItems = signal<Item[]>([
    { name: 'Apple' },
    { name: 'Banana' },
    { name: 'Orange'},
    { name: 'Grapes'}
  ]);

  addNewItem(itemName: string) {
    if (itemName) {
      this.shopItems.update(items => {
        return [...items, { name: itemName }];
      });
    }
  }
}

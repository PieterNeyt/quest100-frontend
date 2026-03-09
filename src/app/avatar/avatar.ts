import {Component, inject, OnInit, signal} from '@angular/core';
import {Asset, Category} from '../model/avatar';
import {ProfileService} from '../services/profileService';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar implements OnInit {
  private service = inject(ProfileService)

  userPoints = 500;
  categories = signal<Category[]>([]);
  activeCategory: Category | null = null;

  equippedItems: Record<string, Asset> = {};

  ngOnInit() {
    this.service.getShopItems().subscribe({
      next: (data) => {
        this.categories.set(data);
        if (this.categories().length > 0) {
          this.activeCategory = this.categories()[0];
        }
      }
    })
  }

  selectCategory(category: Category) {
    this.activeCategory = category;
  }

  toggleItem(item: Asset) {
    if (!item.isOwned) {
      this.buyItem(item);
      return;
    }

    if (this.equippedItems[item.category]?.id === item.id) {
      if (item.category !== 'Body') {
        delete this.equippedItems[item.category];
      }
      return;
    }

    this.equippedItems[item.category] = item;
  }

  buyItem(item: Asset) {
    if (this.userPoints >= item.price) {
      const confirmBuy = confirm(`Buy ${item.name} for ${item.price} points?`);
      if (confirmBuy) {
        this.userPoints -= item.price;
        item.isOwned = true;
        this.toggleItem(item); // Auto-equip after buying
      }
    } else {
      alert("Not enough points!");
    }
  }

  getEquippedLayers(): Asset[] {
    return Object.values(this.equippedItems).sort((a, b) => a.layer_order - b.layer_order);
  }
}

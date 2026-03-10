import {Component, inject, OnInit, signal} from '@angular/core';
import {Asset, Category} from '../model/avatar';
import {ProfileService} from '../services/profileService';
import {ToastService} from '../services/toastService';
import {Profile} from '../model/profile';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar implements OnInit {
  private service = inject(ProfileService)
  private toast = inject(ToastService)
  private profile = inject(ProfileService).profile;

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
    this.service.buyShopItem(item.id).subscribe({
      next: () => {
        this.profile.set({...this.profile(), kudos: this.profile()!.kudos - item.price} as Profile);
        item.isOwned = true;
        this.toggleItem(item);
        this.toast.success("avatar.bought.success")
      },
      error: _ => {
        this.toast.error("avatar.bought.error");
      }
    });
  }

  getEquippedLayers(): Asset[] {
    return Object.values(this.equippedItems).sort((a, b) => a.layer_order - b.layer_order);
  }
}

import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Asset, Category} from '../model/avatar';
import {ProfileService} from '../services/profileService';
import {ToastService} from '../services/toastService';
import {NgIcon} from '@ng-icons/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-avatar',
  imports: [
    NgIcon,
    NgOptimizedImage
  ],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar implements OnInit {
  private service = inject(ProfileService)
  private toast = inject(ToastService)
  private readonly profile = inject(ProfileService).profile;
  readonly t = inject(TranslationService)

  categories = signal<Category[]>([]);
  activeCategory: Category | null = null;

  equippedItems = computed(() => {
    const record: Record<string, Asset> = {};

    this.categories().forEach(category => {
      const equippedAsset = category.items.find((item) => item.equipped);

      if (equippedAsset) {
        record[category.name] = equippedAsset;
      }
    });
    return record;
  });

  sortedLayers = computed(() => {
    return Object.values(this.equippedItems());
  });

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

    this.service.equipItem(item.id).subscribe({
      next: (assets) => {
        const equippedIds = new Set(assets.map(a => a.id));

        this.categories.update(categories =>
          categories.map(cat => ({
            ...cat,
            items: cat.items.map(item => ({
              ...item,
              equipped: equippedIds.has(item.id)
            }))
          }))
        );
      }
    })
  }

  buyItem(item: Asset) {
    this.service.buyShopItem(item.id).subscribe({
      next: () => {
        item.isOwned = true;
        this.toggleItem(item);
        this.toast.success("avatar.bought.success")
      },
      error: _ => {
        this.toast.error("avatar.bought.error");
      }
    });
  }

  canBuy(item: Asset) {
    if (this.profile()) {
      return item.price > this.profile()!.kudos;
    }
    return false;
  }
}

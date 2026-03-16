import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Asset, Category} from '../model/avatar';
import {ProfileService} from '../services/profileService';
import {ToastService} from '../services/toastService';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslationService} from '../services/translationService';
import {lucideCamera} from '@ng-icons/lucide';

@Component({
  selector: 'app-avatar',
  imports: [
    NgIcon,
    NgOptimizedImage
  ],
  providers: [provideIcons({lucideCamera})],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar implements OnInit {
  private service = inject(ProfileService)
  private toast = inject(ToastService)
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
        this.toast.error();
      }
    });
  }

  async setAsProfilePicture() {
    const layers = this.sortedLayers();
    if (layers.length === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    try {
      const token = await this.service.getAccessToken();
      for (const layer of layers) {
        const response = await fetch(this.service.proxyAssetUrl(layer.link), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch ${layer.name}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);
            resolve();
          };
          img.onerror = reject;
          img.src = objectUrl;
        });
      }

      const base64 = canvas.toDataURL('image/png');
      this.service.updateProfilePicture(base64);
      this.toast.success('avatar.setAsProfilePictureMessage.success');
    } catch {
      this.toast.error();
    }
  }
}

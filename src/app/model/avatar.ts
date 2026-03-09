export interface Asset {
  id: string;
  name: string;
  category: string;
  layer_order: number;
  price: number;
  isOwned: boolean;
  link: string;
}

export interface Category {
  name: string;
  items: Asset[];
}

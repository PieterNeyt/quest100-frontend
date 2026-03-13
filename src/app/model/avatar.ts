export interface Asset {
  id: string;
  name: string;
  category: string;
  price: number;
  isOwned: boolean;
  link: string;
  equipped: boolean;
  thumbnail: string;
}

export interface Category {
  name: string;
  items: Asset[];
}

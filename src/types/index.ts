export type BrandCategory = "gaming" | "enthusiast" | "productivity";

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  category: BrandCategory;
  highlights: string[];
  website?: string;
}

export interface Keyboard {
  id: string;
  brandId: string;
  name: string;
  switchType?: string;
  connectivity?: string[];
  priceRange?: string;
  score?: number;
}

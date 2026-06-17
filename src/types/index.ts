export type BrandCategory = "gaming" | "enthusiast" | "productivity";

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  category: BrandCategory;
  highlights: string[];
  website?: string;
}

export interface KeyboardStats {
  switchType: string;
  layout: string;
  connectivity: string[];
  actuationPointMm: number;
  keyTravelMm: number;
  pollingRateHz: number;
  responseTimeMs: number;
  rapidTrigger: boolean;
}

export interface Keyboard {
  id: string;
  brandId: string;
  name: string;
  releaseDate: string;
  priceUsd: number;
  stats: KeyboardStats;
  tagline: string;
  image: string;
  purchaseUrl: string;
  badge?: string;
}

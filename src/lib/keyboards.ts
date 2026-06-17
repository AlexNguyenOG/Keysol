import { brands } from "@/data/brands";
import { keyboards } from "@/data/keyboards";
import type { Brand, Keyboard } from "@/types";

export function getKeyboardsByBrandId(brandId: string): Keyboard[] {
  return keyboards.filter((keyboard) => keyboard.brandId === brandId);
}

export function getBrandById(brandId: string): Brand | undefined {
  return brands.find((brand) => brand.id === brandId);
}

export function getBrandName(brandId: string): string {
  return getBrandById(brandId)?.name ?? brandId;
}

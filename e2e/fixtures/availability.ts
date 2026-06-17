import { keyboards } from "../../src/data/keyboards";
import type { AvailabilityMap } from "../../src/lib/availability/types";

export function mockAvailabilityFixture(
  overrides: Partial<Record<string, AvailabilityMap[string]["status"]>> = {},
): AvailabilityMap {
  const checkedAt = new Date().toISOString();

  return Object.fromEntries(
    keyboards.map((keyboard) => [
      keyboard.id,
      {
        keyboardId: keyboard.id,
        status: overrides[keyboard.id] ?? "in_stock",
        checkedAt,
        source: keyboard.purchaseUrl,
      },
    ]),
  );
}

export function mockAvailabilityResponse(
  overrides?: Partial<Record<string, AvailabilityMap[string]["status"]>>,
) {
  return {
    availability: mockAvailabilityFixture(overrides),
    refreshedAt: new Date().toISOString(),
  };
}

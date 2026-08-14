export type ShopItemKind = "focus_bonus" | "coffee_refill" | "junk";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  kind: ShopItemKind;
  repeatable: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "better_coffee",
    name: "Better Coffee",
    description: "A subscription to the good beans. +1 Focus every sprint, for the rest of the run.",
    cost: 20,
    kind: "focus_bonus",
    repeatable: false,
  },
  {
    id: "coffee_refill",
    name: "Coffee Refill",
    description: "Instantly refills your Coffee to full.",
    cost: 10,
    kind: "coffee_refill",
    repeatable: true,
  },
  {
    id: "standing_desk",
    name: "Standing Desk Converter",
    description: "You will use this twice.",
    cost: 8,
    kind: "junk",
    repeatable: true,
  },
  {
    id: "motivational_poster",
    name: "Motivational Cat Poster",
    description: '"Hang in there." Does not help.',
    cost: 3,
    kind: "junk",
    repeatable: true,
  },
  {
    id: "kombucha_subscription",
    name: "Kombucha Subscription",
    description: "Fizzy. Expensive. Doesn't do anything.",
    cost: 6,
    kind: "junk",
    repeatable: true,
  },
];

export interface PurchaseCheck {
  allowed: boolean;
  reason?: string;
}

export function canPurchase(
  itemId: string,
  runway: number,
  alreadyPurchased: string[],
): PurchaseCheck {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { allowed: false, reason: "unknown item" };
  if (runway < item.cost) return { allowed: false, reason: "insufficient runway" };
  if (!item.repeatable && alreadyPurchased.includes(itemId)) {
    return { allowed: false, reason: "already purchased" };
  }
  return { allowed: true };
}

export interface PurchaseEffect {
  runwayDelta: number;
  focusBonusDelta: number;
  coffeeSetTo?: number;
}

export function applyPurchase(itemId: string): PurchaseEffect {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error(`Unknown shop item: ${itemId}`);

  const base: PurchaseEffect = { runwayDelta: -item.cost, focusBonusDelta: 0 };
  if (item.kind === "focus_bonus") return { ...base, focusBonusDelta: 1 };
  if (item.kind === "coffee_refill") return { ...base, coffeeSetTo: 100 };
  return base;
}

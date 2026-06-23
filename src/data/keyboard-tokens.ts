import type { KeyboardToken } from "@/types";

/**
 * KeySol keyboard tokens — one per catalog board.
 * Rarity = stable catalog baseline. Live stock is merged server-side at snapshot time.
 * Off-chain registry only; mint addresses are filled in when you deploy on Solana.
 */
export const keyboardTokens: KeyboardToken[] = [
  {
    id: "keysol-wooting-60he",
    keyboardId: "wooting-60he-plus",
    symbol: "KSOL-W60HE",
    name: "KeySol Wooting 60HE+ Token",
    rarityTier: "legendary",
    rarityScore: 100,
    maxSupply: 500,
    rationale:
      "Batch-drop hall-effect board with chronic restock scarcity and esports demand.",
  },
  {
    id: "keysol-wooting-two-he",
    keyboardId: "wooting-two-he",
    symbol: "KSOL-W2HE",
    name: "KeySol Wooting Two HE Token",
    rarityTier: "legendary",
    rarityScore: 98,
    maxSupply: 500,
    rationale:
      "Full-size Wooting HE shares the same limited production runs as the 60HE+ line.",
  },
  {
    id: "keysol-apex-pro-gen3-tkl",
    keyboardId: "steelseries-apex-pro-gen3-tkl",
    symbol: "KSOL-AP3TKL",
    name: "KeySol Apex Pro Gen 3 TKL Token",
    rarityTier: "rare",
    rarityScore: 88,
    maxSupply: 750,
    rationale:
      "$300 OmniPoint 3.0 TKL flagship with smaller production volume than the full-size.",
  },
  {
    id: "keysol-corsair-k70-max",
    keyboardId: "corsair-k70-max",
    symbol: "KSOL-K70MAX",
    name: "KeySol Corsair K70 MAX Token",
    rarityTier: "rare",
    rarityScore: 85,
    maxSupply: 1000,
    rationale:
      "Magnetic MGX flagship that frequently sells through at major retailers.",
  },
  {
    id: "keysol-hyperx-alloy-rise",
    keyboardId: "hyperx-alloy-rise",
    symbol: "KSOL-ALRISE",
    name: "KeySol HyperX Alloy Rise Token",
    rarityTier: "rare",
    rarityScore: 82,
    maxSupply: 1000,
    rationale:
      "HyperX's first magnetic full-size — early run with strong competitive demand.",
  },
  {
    id: "keysol-hyperx-origins-2-pro-65",
    keyboardId: "hyperx-origins-2-pro-65",
    symbol: "KSOL-O2P65",
    name: "KeySol Origins 2 Pro 65 Token",
    rarityTier: "rare",
    rarityScore: 80,
    maxSupply: 1200,
    rationale:
      "New magnetic 65% with rapid trigger — limited early availability in the Origins 2 line.",
  },
  {
    id: "keysol-corsair-k70-pro-tkl-he",
    keyboardId: "corsair-k70-pro-tkl-he",
    symbol: "KSOL-K70PTKL",
    name: "KeySol Corsair K70 PRO TKL HE Token",
    rarityTier: "rare",
    rarityScore: 78,
    maxSupply: 1200,
    rationale:
      "Newer hall-effect TKL with MGX Hyperdrive — high demand in the magnetic segment.",
  },
  {
    id: "keysol-apex-pro-gen3",
    keyboardId: "steelseries-apex-pro-gen3",
    symbol: "KSOL-AP3FS",
    name: "KeySol Apex Pro Gen 3 Token",
    rarityTier: "rare",
    rarityScore: 76,
    maxSupply: 1500,
    rationale:
      "OmniPoint 3.0 full-size flagship with OLED — premium tier with tighter stock than mainstream boards.",
  },
  {
    id: "keysol-razer-huntsman-v3-pro-tkl",
    keyboardId: "razer-huntsman-v3-pro-tkl-8khz",
    symbol: "KSOL-HV3TKL",
    name: "KeySol Huntsman V3 Pro TKL Token",
    rarityTier: "rare",
    rarityScore: 74,
    maxSupply: 1500,
    rationale:
      "Analog optical TKL at 8 kHz — niche flagship with strong esports pull and periodic sellouts.",
  },
  {
    id: "keysol-razer-huntsman-v3-pro-mini",
    keyboardId: "razer-huntsman-v3-pro-mini",
    symbol: "KSOL-HV3MINI",
    name: "KeySol Huntsman V3 Pro Mini Token",
    rarityTier: "rare",
    rarityScore: 72,
    maxSupply: 1500,
    rationale:
      "Compact 60% analog optical board — smaller run than standard Huntsman variants.",
  },
  {
    id: "keysol-keychron-q1-he",
    keyboardId: "keychron-q1-he",
    symbol: "KSOL-Q1HE",
    name: "KeySol Keychron Q1 HE Token",
    rarityTier: "uncommon",
    rarityScore: 70,
    maxSupply: 2000,
    rationale:
      "Premium aluminum hall-effect board with enthusiast demand and periodic sellouts.",
  },
  {
    id: "keysol-keychron-k2-he",
    keyboardId: "keychron-k2-he",
    symbol: "KSOL-K2HE",
    name: "KeySol Keychron K2 HE Token",
    rarityTier: "uncommon",
    rarityScore: 68,
    maxSupply: 2500,
    rationale:
      "Popular wireless magnetic 75% that often goes out of stock during restock waves.",
  },
  {
    id: "keysol-logitech-g515",
    keyboardId: "logitech-g515-rapid-tkl",
    symbol: "KSOL-G515",
    name: "KeySol Logitech G515 RAPID TKL Token",
    rarityTier: "uncommon",
    rarityScore: 62,
    maxSupply: 3000,
    rationale:
      "New low-profile magnetic analog line — growing demand as Logitech's rapid-trigger entry.",
  },
  {
    id: "keysol-hyperx-origins-2-65",
    keyboardId: "hyperx-origins-2-65",
    symbol: "KSOL-O265",
    name: "KeySol Origins 2 65 Token",
    rarityTier: "uncommon",
    rarityScore: 58,
    maxSupply: 3500,
    rationale:
      "8 kHz hot-swap Origins 2 compact — widely stocked but newer than legacy Alloy boards.",
  },
  {
    id: "keysol-hyperx-origins-2-1800",
    keyboardId: "hyperx-origins-2-1800",
    symbol: "KSOL-O2180",
    name: "KeySol Origins 2 1800 Token",
    rarityTier: "uncommon",
    rarityScore: 56,
    maxSupply: 3500,
    rationale:
      "1800 compact layout with 8 kHz polling — fresh SKU with moderate early-run availability.",
  },
  {
    id: "keysol-logitech-g-pro-x-tkl",
    keyboardId: "logitech-g-pro-x-tkl-lightspeed",
    symbol: "KSOL-GPROX",
    name: "KeySol G Pro X TKL Lightspeed Token",
    rarityTier: "uncommon",
    rarityScore: 54,
    maxSupply: 4000,
    rationale:
      "Pro wireless TKL with steady retail presence — less scarce than magnetic flagships.",
  },
  {
    id: "keysol-corsair-k70-rgb-pro",
    keyboardId: "corsair-k70-rgb-pro",
    symbol: "KSOL-K70PRO",
    name: "KeySol Corsair K70 RGB Token",
    rarityTier: "uncommon",
    rarityScore: 48,
    maxSupply: 5000,
    rationale:
      "Mass-market speed-silver K70 with broad retailer distribution and regular restocks.",
  },
  {
    id: "keysol-ducky-one-3-tkl",
    keyboardId: "ducky-one-3-rgb-tkl",
    symbol: "KSOL-D1TKL",
    name: "KeySol Ducky One 3 RGB TKL Token",
    rarityTier: "uncommon",
    rarityScore: 46,
    maxSupply: 5000,
    rationale:
      "Enthusiast TKL sold through specialty retailers — available but not big-box omnipresent.",
  },
  {
    id: "keysol-ducky-one-3-mini",
    keyboardId: "ducky-one-3-mini-sf",
    symbol: "KSOL-D1MINI",
    name: "KeySol Ducky One 3 Mini SF Token",
    rarityTier: "uncommon",
    rarityScore: 44,
    maxSupply: 5000,
    rationale:
      "Compact Ducky speed build with niche retailer channels and variant-dependent stock.",
  },
  {
    id: "keysol-corsair-k70-rgb-mk2",
    keyboardId: "corsair-k70-rgb-mk2",
    symbol: "KSOL-K70MK2",
    name: "KeySol Corsair K70 RGB MK.2 Token",
    rarityTier: "uncommon",
    rarityScore: 35,
    maxSupply: 10000,
    rationale:
      "Legacy full-size K70 with long production history — easiest board in the catalog to source.",
  },
  {
    id: "keysol-wooting-80he",
    keyboardId: "wooting-80he",
    symbol: "KSOL-W80HE",
    name: "KeySol Wooting 80HE Token",
    rarityTier: "legendary",
    rarityScore: 97,
    maxSupply: 500,
    rationale:
      "Flagship 80% Wooting with true 8 kHz — high demand and frequent restock sellouts.",
  },
  {
    id: "keysol-razer-hv3-full",
    keyboardId: "razer-huntsman-v3-pro-8khz",
    symbol: "KSOL-HV3FS",
    name: "KeySol Huntsman V3 Pro 8KHz Token",
    rarityTier: "rare",
    rarityScore: 73,
    maxSupply: 1500,
    rationale:
      "Full-size 8 kHz analog optical flagship — newest Razer speed tier board.",
  },
  {
    id: "keysol-keychron-q3-he-8k",
    keyboardId: "keychron-q3-he-8k",
    symbol: "KSOL-Q3HE8K",
    name: "KeySol Keychron Q3 HE 8K Token",
    rarityTier: "rare",
    rarityScore: 71,
    maxSupply: 2000,
    rationale:
      "Keychron's aluminum 8 kHz TKL magnetic board — strong enthusiast demand.",
  },
  {
    id: "keysol-nuphy-field75-he",
    keyboardId: "nuphy-field75-he",
    symbol: "KSOL-F75HE",
    name: "KeySol NuPhy Field75 HE Token",
    rarityTier: "rare",
    rarityScore: 69,
    maxSupply: 2500,
    rationale:
      "Popular value 75% magnetic board with 8 kHz — often restocks quickly but high interest.",
  },
  {
    id: "keysol-apex-pro-tkl-v2",
    keyboardId: "steelseries-apex-pro-tkl-v2",
    symbol: "KSOL-APTKL2",
    name: "KeySol Apex Pro TKL Token",
    rarityTier: "rare",
    rarityScore: 67,
    maxSupply: 3000,
    rationale:
      "OmniPoint 2.0 TKL — still widely available but superseded by Gen 3 for 8 kHz.",
  },
  {
    id: "keysol-apex-pro-mini",
    keyboardId: "steelseries-apex-pro-mini",
    symbol: "KSOL-APMINI",
    name: "KeySol Apex Pro Mini Token",
    rarityTier: "uncommon",
    rarityScore: 65,
    maxSupply: 3500,
    rationale:
      "Compact OmniPoint 2.0 board with steady retail availability.",
  },
];

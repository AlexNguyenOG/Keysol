export type SwitchCategoryId =
  | "hall-effect"
  | "magnetic"
  | "optical"
  | "mechanical"
  | "low-profile";

export interface SwitchCategory {
  id: SwitchCategoryId;
  name: string;
  summary: string;
  accentClass: string;
}

export interface SwitchTypeEntry {
  id: string;
  categoryId: SwitchCategoryId;
  name: string;
  tagline: string;
  howItWorks: string;
  actuation: string;
  /** Short sensory note — how the switch sounds at the desk. */
  sound: string;
  /** Short sensory note — how the switch feels under the finger. */
  feel: string;
  strengths: string[];
  tradeoffs: string[];
  bestFor: string;
  rapidTrigger: boolean;
  keyboardIds: string[];
}

export const switchCategories: SwitchCategory[] = [
  {
    id: "hall-effect",
    name: "Hall-Effect",
    summary:
      "Magnetic sensors track key travel with no physical contact. The gold standard for analog input and ultra-low actuation.",
    accentClass: "text-solana-green border-solana-green/30 bg-solana-green/10",
  },
  {
    id: "magnetic",
    name: "Magnetic / Adjustable",
    summary:
      "Magnetic switches with software-tuned actuation points. Rapid trigger and per-key customization without soldering.",
    accentClass: "text-solana-purple border-solana-purple/30 bg-solana-purple/10",
  },
  {
    id: "optical",
    name: "Optical",
    summary:
      "Light beams register keypresses instead of metal contacts. Extremely fast debounce and long switch life.",
    accentClass: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  },
  {
    id: "mechanical",
    name: "Mechanical",
    summary:
      "Classic metal-leaf or crosspoint designs. Tactile feedback, proven reliability, and huge switch ecosystem.",
    accentClass: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  },
  {
    id: "low-profile",
    name: "Low-Profile",
    summary:
      "Shorter key travel in a slim chassis. Popular for FPS desks and users who prefer a laptop-like keystroke.",
    accentClass: "text-pink-300 border-pink-400/30 bg-pink-400/10",
  },
];

export const switchTypes: SwitchTypeEntry[] = [
  {
    id: "lekker-he",
    categoryId: "hall-effect",
    name: "Lekker (Hall-Effect)",
    tagline: "Wooting's analog hall-effect line",
    howItWorks:
      "Hall sensors measure magnetic field strength as the stem moves. Every key reports full travel as an analog value, not just on/off.",
    actuation: "Down to ~0.1 mm with analog tuning",
    sound:
      "Soft, muted thock with a clean bottom-out — little ping or spring noise.",
    feel:
      "Butter-smooth linear glide; the key feels like it floats through travel once actuation is set shallow.",
    strengths: [
      "Full analog input for games",
      "Rapid trigger & adjustable actuation",
      "No contact wear — rated for 100M+ actuations",
    ],
    tradeoffs: [
      "Requires Wooting software for full feature set",
      "Premium price vs standard mechanical",
    ],
    bestFor: "Competitive FPS players who want analog movement and rapid trigger",
    rapidTrigger: true,
    keyboardIds: ["wooting-60he-plus", "wooting-two-he", "wooting-80he"],
  },
  {
    id: "gateron-jupiter-he",
    categoryId: "hall-effect",
    name: "Gateron Jupiter (Hall-Effect)",
    tagline: "Keychron's magnetic hall-effect stack",
    howItWorks:
      "Magnetic hall sensors inside a hot-swappable housing deliver adjustable actuation with QMK/VIA support on HE models.",
    actuation: "Adjustable via software on HE boards",
    sound:
      "Medium-low clack with a damped, slightly foamy tone on most HE builds.",
    feel:
      "Light, smooth linear with minimal stem wobble and an even press top to bottom.",
    strengths: [
      "Hot-swappable magnetic ecosystem",
      "Wireless options on HE models",
      "Strong enthusiast value",
    ],
    tradeoffs: ["Feature depth varies by firmware", "Less analog-native than Wooting"],
    bestFor: "Enthusiasts who want HE performance with custom keyboard layouts",
    rapidTrigger: true,
    keyboardIds: ["keychron-q1-he", "keychron-k2-he", "nuphy-field75-he"],
  },
  {
    id: "corsair-mgx",
    categoryId: "magnetic",
    name: "Corsair MGX (Magnetic)",
    tagline: "Corsair's adjustable magnetic switches",
    howItWorks:
      "Magnetic hall sensors detect stem position. iCUE lets you set actuation depth per key and enable rapid trigger on supported models.",
    actuation: "0.1–3.8 mm adjustable on HE models",
    sound:
      "Crisp but controlled clack; iCUE-tuned boards keep ping and rattle in check.",
    feel:
      "Quick, snappy linear with a short effective travel once you dial actuation in.",
    strengths: [
      "Deep iCUE integration",
      "Up to 8,000 Hz polling on flagship HE boards",
      "Rapid trigger & FlashTap on K70 PRO TKL HE",
    ],
    tradeoffs: ["Best features locked to iCUE", "Full-size HE boards are bulky"],
    bestFor: "Corsair ecosystem users who want magnetic tuning with high polling",
    rapidTrigger: true,
    keyboardIds: ["corsair-k70-pro-tkl-he", "corsair-k70-max"],
  },
  {
    id: "omnipoint-3",
    categoryId: "magnetic",
    name: "OmniPoint 3.0 (Magnetic)",
    tagline: "SteelSeries adjustable hyper-magnetic switches",
    howItWorks:
      "Redesigned hall-effect switches with 20× faster actuation sensing than mechanical. Per-key actuation from 0.1–4.0 mm in SteelSeries GG.",
    actuation: "0.1–4.0 mm per key",
    sound:
      "Tight, muted keystroke with a firm landing — esports-tuned and not overly loud.",
    feel:
      "Stable linear with almost no pre-travel slack; precise and quick off the top.",
    strengths: [
      "Protection Mode & Rapid Trigger in GG",
      "OLED display for on-board tuning",
      "8,000 Hz polling on Gen 3 line",
    ],
    tradeoffs: ["SteelSeries GG required for tuning", "Premium flagship pricing"],
    bestFor: "Esports players invested in SteelSeries software ecosystem",
    rapidTrigger: true,
    keyboardIds: ["steelseries-apex-pro-gen3", "steelseries-apex-pro-gen3-tkl"],
  },
  {
    id: "omnipoint-2",
    categoryId: "magnetic",
    name: "OmniPoint 2.0 (Magnetic)",
    tagline: "SteelSeries adjustable hyper-magnetic Gen 2",
    howItWorks:
      "Magnetic hall-effect sensing with per-key actuation from 0.1–4.0 mm and rapid trigger via SteelSeries GG.",
    actuation: "Down to 0.1 mm with software tuning",
    sound:
      "Similar to OmniPoint 3 but a touch more housing resonance on hard presses.",
    feel:
      "Clean linear with a tunable break point — feels lighter when actuation is set shallow.",
    strengths: [
      "Rapid trigger on Mini and TKL",
      "Adjustable actuation per key",
      "Compact layouts for esports desks",
    ],
    tradeoffs: ["1000 Hz polling vs Gen 3 8 kHz", "SteelSeries Engine required"],
    bestFor: "Players who want OmniPoint tuning in 60% or TKL form factors",
    rapidTrigger: true,
    keyboardIds: ["steelseries-apex-pro-mini", "steelseries-apex-pro-tkl-v2"],
  },
  {
    id: "gateron-double-rail",
    categoryId: "magnetic",
    name: "Gateron Double-Rail Magnetic",
    tagline: "Stable magnetic switch with dual rails",
    howItWorks:
      "Two rails guide the stem while magnets and sensors track position. Reduces wobble and enables magnetic actuation tuning.",
    actuation: "Software-adjustable on supported HE firmware",
    sound:
      "Controlled clack with less stem rattle thanks to the dual-rail guide.",
    feel:
      "Very centered, stable linear — the stem tracks straight with a confident push.",
    strengths: ["Very stable key feel", "Hot-swappable on Q1 HE", "Good for modders"],
    tradeoffs: ["Switch ecosystem still growing vs Cherry MX"],
    bestFor: "Custom board fans who want magnetic switches in a premium chassis",
    rapidTrigger: true,
    keyboardIds: ["keychron-q1-he", "keychron-q3-he-8k", "keychron-q6-he-8k"],
  },
  {
    id: "hyperx-magnetic",
    categoryId: "magnetic",
    name: "HyperX Magnetic Switch",
    tagline: "HyperX's entry into adjustable magnetic",
    howItWorks:
      "Magnetic sensing replaces traditional contact points. Alloy Rise and Origins 2 Pro 65 pair magnetic switches with HyperX NGENUITY tuning and rapid trigger.",
    actuation: "Adjustable actuation on magnetic models",
    sound:
      "Medium-pitch clack with a softer bottom-out on Alloy and Origins shells.",
    feel:
      "Smooth magnetic glide with a gentle landing — less harsh than speed mechanicals.",
    strengths: ["Strong value in magnetic segment", "HyperX NGENUITY integration"],
    tradeoffs: ["Magnetic line still smaller than Corsair or SteelSeries"],
    bestFor: "Gamers wanting magnetic features without flagship price tags",
    rapidTrigger: true,
    keyboardIds: ["hyperx-alloy-rise", "hyperx-origins-2-pro-65"],
  },
  {
    id: "razer-optical-gen2",
    categoryId: "optical",
    name: "Razer Analog Optical Gen-2",
    tagline: "Razer's light-based analog optical switches",
    howItWorks:
      "An infrared beam is interrupted when you press a key — no metal debounce delay. Gen-2 adds analog sensing for adjustable actuation.",
    actuation: "Down to ~0.1 mm with analog tuning",
    sound:
      "Light, quick tick at actuation — optical stems tend to sound brighter and cleaner.",
    feel:
      "Extremely light and fast with almost no debounce slack; floaty at shallow actuation.",
    strengths: [
      "Near-instant optical registration",
      "8,000 Hz HyperPolling support",
      "Snap Tap & analog features in Synapse",
    ],
    tradeoffs: [
      "Razer Synapse needed for full feature set",
      "Optical feel differs from mechanical tactility",
    ],
    bestFor: "Razer fans who want optical speed with analog esports features",
    rapidTrigger: true,
    keyboardIds: ["razer-huntsman-v3-pro-tkl-8khz", "razer-huntsman-v3-pro-mini", "razer-huntsman-v3-pro-8khz"],
  },
  {
    id: "cherry-mx-speed",
    categoryId: "mechanical",
    name: "Cherry MX Speed Silver",
    tagline: "Cherry's low-travel linear speed switch",
    howItWorks:
      "Traditional metal contact leaves with a shortened travel distance and lighter spring. Actuates at 1.2 mm with 3.4 mm total travel.",
    actuation: "1.2 mm actuation · 3.4 mm travel",
    sound:
      "Classic Cherry clack — sharper and brighter than MX Red, with a short bottom-out.",
    feel:
      "Short-travel linear with a crisp snap at 1.2 mm; familiar mechanical speed switch.",
    strengths: [
      "Proven Cherry build quality",
      "Easy to find replacement switches",
      "Great for fast linear typing and gaming",
    ],
    tradeoffs: [
      "Fixed actuation — no rapid trigger",
      "1,000 Hz polling on most Ducky/Corsair boards",
    ],
    bestFor: "Players who want trusted mechanical feel without magnetic complexity",
    rapidTrigger: false,
    keyboardIds: [
      "ducky-one-3-rgb-tkl",
      "ducky-one-3-rgb-full",
      "ducky-one-3-mini-sf",
      "corsair-k70-rgb-mk2",
      "corsair-k70-rgb-pro",
    ],
  },
  {
    id: "cherry-mx-red",
    categoryId: "mechanical",
    name: "Cherry MX Red",
    tagline: "Classic linear gaming switch",
    howItWorks:
      "Linear stem compresses a spring until gold contacts meet. Smooth keystroke with no tactile bump.",
    actuation: "2.0 mm actuation · 4.0 mm travel",
    sound:
      "Lower-pitched linear thock than Speed Silver — fuller, less sharp on bottom-out.",
    feel:
      "Smooth 4 mm linear with a heavier spring; comfortable for long sessions.",
    strengths: ["Ubiquitous and well-supported", "Smooth linear feel", "Reliable daily driver"],
    tradeoffs: ["Slower actuation vs Speed Silver or magnetic", "No per-key tuning"],
    bestFor: "General gaming and typing on a traditional full-size board",
    rapidTrigger: false,
    keyboardIds: ["corsair-k70-rgb-mk2"],
  },
  {
    id: "logitech-gx",
    categoryId: "mechanical",
    name: "Logitech GX (Hot-Swappable)",
    tagline: "Logitech's pro-grade mechanical switch socket",
    howItWorks:
      "Standard mechanical contact switches in a hot-swappable GX socket. Swap between GX Red, Blue, Brown, or tactile variants.",
    actuation: "Varies by GX switch (~1.9 mm on many linear variants)",
    sound:
      "Medium clack with a solid bottom-out — tone depends on your GX linear, tactile, or clicky choice.",
    feel:
      "Classic mechanical depending on the socket; GX linears feel quick, tactiles add a noticeable bump.",
    strengths: [
      "Hot-swappable pro boards",
      "Lightspeed wireless on G Pro line",
      "Tournament-trusted form factor",
    ],
    tradeoffs: ["Not magnetic/optical speed tier", "GX ecosystem only (not MX compatible)"],
    bestFor: "Pro players who prioritize wireless reliability and switch choice",
    rapidTrigger: false,
    keyboardIds: ["logitech-g-pro-x-tkl-lightspeed"],
  },
  {
    id: "hyperx-linear-red",
    categoryId: "mechanical",
    name: "HyperX Linear Red",
    tagline: "HyperX's in-house linear switch",
    howItWorks:
      "HyperX-designed linear switch with factory lubrication on Origins 2 boards. Standard contact-based actuation with up to 8,000 Hz polling.",
    actuation: "1.8 mm actuation · 3.8–4.0 mm travel",
    sound:
      "Soft-moderate clack with factory lube — muted and pleasant on Origins 2 plates.",
    feel:
      "Smooth linear daily driver; not as short or sharp as Cherry Speed Silver.",
    strengths: [
      "Comfortable stock tuning",
      "Hot-swap on Origins 2 line",
      "8,000 Hz polling on Origins 2 models",
    ],
    tradeoffs: ["No adjustable actuation", "No rapid trigger vs magnetic Origins Pro"],
    bestFor: "Compact desk setups and value-focused mechanical gaming",
    rapidTrigger: false,
    keyboardIds: ["hyperx-origins-2-65", "hyperx-origins-2-1800"],
  },
  {
    id: "logitech-low-profile-magnetic",
    categoryId: "low-profile",
    name: "Low-Profile Magnetic Analog",
    tagline: "Logitech G515 slim magnetic stack",
    howItWorks:
      "Short-travel magnetic switches in a low-profile chassis. Analog sensing enables rapid trigger in a thinner board.",
    actuation: "Down to ~0.1 mm with analog tuning",
    sound:
      "Quiet, short-throw tick — less keycap resonance than full-height boards.",
    feel:
      "Shallow, laptop-like stroke with magnetic smoothness; actuation happens near the top.",
    strengths: [
      "Slim desk-friendly design",
      "Magnetic rapid trigger in low profile",
      "Strong for FPS wrist angle preferences",
    ],
    tradeoffs: ["Less key travel feel vs full-height HE", "Newer switch platform"],
    bestFor: "Gamers who want magnetic speed without a tall board",
    rapidTrigger: true,
    keyboardIds: ["logitech-g515-rapid-tkl"],
  },
];

export function getSwitchTypesByCategory(categoryId: SwitchCategoryId) {
  return switchTypes.filter((entry) => entry.categoryId === categoryId);
}

export function getSwitchTypeForKeyboard(
  keyboardId: string,
): SwitchTypeEntry | undefined {
  return switchTypes.find((entry) => entry.keyboardIds.includes(keyboardId));
}

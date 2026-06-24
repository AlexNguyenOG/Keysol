import { keyboardTokens } from "@/data/keyboard-tokens";
import { getAllKeyboards } from "@/lib/catalog.server";
import { getBrandName } from "@/lib/keyboards";
import {
  computeSpeedScore,
  getRankedKeyboards,
  SCORE_CRITERIA,
} from "@/lib/rankings";
import type { Keyboard } from "@/types";
import {
  findKeyboardsByQuery,
  findSwitchTypesByQuery,
  formatKeyboardSummary,
} from "./knowledge";
import { isOffTopicMessage, OFF_TOPIC_REPLY } from "./rules";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function listKeyboards(items: Keyboard[], limit = 3): string {
  return items
    .slice(0, limit)
    .map((keyboard, index) => `${index + 1}. ${formatKeyboardSummary(keyboard)}`)
    .join("\n");
}

function explainRapidTrigger(): string {
  const criterion = SCORE_CRITERIA.find((item) => item.key === "rapidTrigger");
  return [
    "Rapid trigger is a hall-effect / magnetic keyboard feature that resets a key the moment you release it, without waiting for the switch to physically travel back up.",
    "That lets you spam movement keys faster in games because the keyboard re-arms sooner.",
    criterion?.description ?? "",
    "In KeySol's speed score, getAllKeyboards() with rapid trigger get a +10 point bonus.",
    `Examples with rapid trigger: ${getRankedKeyboards(getAllKeyboards().filter((k) => k.stats.rapidTrigger)).slice(0, 3).map((k) => k.name).join(", ")}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function explainPollingRate(): string {
  const criterion = SCORE_CRITERIA.find((item) => item.key === "polling");
  const top = getRankedKeyboards(getAllKeyboards(), "speed")[0];
  return [
    "Polling rate is how often the keyboard reports key state to your PC, measured in Hz.",
    "Standard boards are 1,000 Hz. High-end gaming boards go up to 8,000 Hz for lower input latency.",
    criterion?.description ?? "",
    `Fastest pick in our catalog right now: ${top.name} at ${top.stats.pollingRateHz} Hz (speed score ${top.score}/100).`,
  ]
    .filter(Boolean)
    .join(" ");
}

function explainActuation(): string {
  return [
    "Actuation point is how far you press a key before it registers.",
    "Lower actuation can feel faster because the key fires sooner in the travel.",
    "Magnetic and hall-effect boards often go down to about 0.1 mm with software tuning.",
    `Lowest actuation in our catalog: ${[...getAllKeyboards()].sort((a, b) => a.stats.actuationPointMm - b.stats.actuationPointMm)[0].name}.`,
  ].join(" ");
}

function explainHallEffect(): string {
  const heBoards = findKeyboardsByQuery("hall magnetic lekker omnipoint mgx");
  return [
    "Hall-effect and magnetic getAllKeyboards() use sensors instead of metal contact leaves, so they can support adjustable actuation and rapid trigger.",
    "They're popular for competitive FPS because you can tune sensitivity per key.",
    heBoards.length > 0
      ? `Magnetic / hall-effect options here:\n${listKeyboards(heBoards, 5)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function answerFastest(): string {
  const ranked = getRankedKeyboards(getAllKeyboards(), "speed").slice(0, 5);
  return [
    "These are the top speed picks in KeySol's catalog, ranked by polling rate, response time, actuation, and rapid trigger:",
    listKeyboards(ranked, 5),
    "See the full leaderboard at /rankings.",
  ].join("\n\n");
}

function answerCheapest(): string {
  const cheapest = [...getAllKeyboards()].sort((a, b) => a.priceUsd - b.priceUsd).slice(0, 5);
  return [
    "Best budget picks in the catalog:",
    listKeyboards(cheapest, 5),
  ].join("\n\n");
}

function answerWireless(): string {
  const wireless = getAllKeyboards().filter((keyboard) =>
    keyboard.stats.connectivity.some((option) =>
      /wireless|lightspeed|bluetooth/i.test(option),
    ),
  );

  if (wireless.length === 0) {
    return "I don't have a wireless keyboard listed in the catalog right now.";
  }

  return [
    "Wireless options in the catalog:",
    listKeyboards(wireless, 5),
  ].join("\n\n");
}

function answerLayout(layout: string): string {
  const matches = getAllKeyboards().filter((keyboard) =>
    keyboard.stats.layout.toLowerCase().includes(layout),
  );

  if (matches.length === 0) {
    return `I don't have any ${layout} boards in the catalog yet.`;
  }

  return [
    `${layout} options:`,
    listKeyboards(matches, 5),
  ].join("\n\n");
}

function answerBrand(text: string): string | null {
  const brandMatch = getAllKeyboards().find((keyboard) =>
    includesAny(text, [
      keyboard.brandId,
      getBrandName(keyboard.brandId).toLowerCase(),
    ]),
  );

  if (!brandMatch) {
    return null;
  }

  const brandBoards = getAllKeyboards().filter(
    (keyboard) => keyboard.brandId === brandMatch.brandId,
  );

  return [
    `${getBrandName(brandMatch.brandId)} getAllKeyboards() in KeySol:`,
    listKeyboards(
      getRankedKeyboards(brandBoards, "speed"),
      Math.min(brandBoards.length, 5),
    ),
  ].join("\n\n");
}

function answerCompare(text: string): string | null {
  const matches = findKeyboardsByQuery(text);
  if (matches.length < 2) {
    return null;
  }

  const [first, second] = matches;
  const firstScore = computeSpeedScore(first);
  const secondScore = computeSpeedScore(second);

  return [
    `Comparing ${first.name} vs ${second.name}:`,
    `- ${first.name}: $${first.priceUsd}, speed ${firstScore}/100, ${first.stats.switchType}, ${first.stats.pollingRateHz} Hz, ${first.stats.layout}`,
    `- ${second.name}: $${second.priceUsd}, speed ${secondScore}/100, ${second.stats.switchType}, ${second.stats.pollingRateHz} Hz, ${second.stats.layout}`,
    firstScore > secondScore
      ? `${first.name} ranks higher for raw speed in KeySol's score.`
      : secondScore > firstScore
        ? `${second.name} ranks higher for raw speed in KeySol's score.`
        : "Both score similarly for speed here — pick based on layout, price, or wireless needs.",
  ].join("\n");
}

function answerBudget(text: string): string | null {
  const budgetMatch = text.match(/under\s+\$?\s*(\d+)/i);
  if (!budgetMatch) {
    return null;
  }

  const budget = Number(budgetMatch[1]);
  const affordable = getAllKeyboards()
    .filter((keyboard) => keyboard.priceUsd <= budget)
    .sort((a, b) => computeSpeedScore(b) - computeSpeedScore(a));

  if (affordable.length === 0) {
    return `Nothing in the catalog is under $${budget} right now. The cheapest board is ${[...getAllKeyboards()].sort((a, b) => a.priceUsd - b.priceUsd)[0].name}.`;
  }

  return [
    `Best speed picks under $${budget}:`,
    listKeyboards(affordable, 5),
  ].join("\n\n");
}

function answerSpecificKeyboard(text: string): string | null {
  const matches = findKeyboardsByQuery(text);
  if (matches.length === 0) {
    return null;
  }

  const keyboard = matches[0];
  const score = computeSpeedScore(keyboard);

  return [
    `${keyboard.name} (${getBrandName(keyboard.brandId)})`,
    keyboard.tagline,
    `$${keyboard.priceUsd} · speed score ${score}/100`,
    `Switch: ${keyboard.stats.switchType}`,
    `Layout: ${keyboard.stats.layout}`,
    `Connectivity: ${keyboard.stats.connectivity.join(", ")}`,
    `Polling: ${keyboard.stats.pollingRateHz} Hz · actuation ${keyboard.stats.actuationPointMm} mm · travel ${keyboard.stats.keyTravelMm} mm`,
    keyboard.stats.rapidTrigger
      ? "Supports rapid trigger."
      : "No rapid trigger listed.",
    `Purchase: ${keyboard.purchaseUrl}`,
  ].join("\n");
}

function answerSwitchType(text: string): string | null {
  const matches = findSwitchTypesByQuery(text);
  if (matches.length === 0) {
    return null;
  }

  const entry = matches[0];
  const boards = entry.keyboardIds
    .map((id) => getAllKeyboards().find((keyboard) => keyboard.id === id))
    .filter(Boolean) as Keyboard[];

  return [
    `${entry.name} — ${entry.tagline}`,
    entry.howItWorks,
    `Actuation: ${entry.actuation}`,
    `Feel: ${entry.feel}`,
    `Sound: ${entry.sound}`,
    `Best for: ${entry.bestFor}`,
    entry.rapidTrigger ? "Supports rapid trigger." : "No rapid trigger.",
    boards.length > 0
      ? `Boards in our catalog:\n${listKeyboards(boards, 5)}`
      : "No catalog boards linked yet.",
  ].join("\n");
}

function answerTokens(): string {
  const top = [...keyboardTokens]
    .sort((a, b) => b.rarityScore - a.rarityScore)
    .slice(0, 5);

  return [
    "KeySol keyboard tokens are collectible rarity tags tied to catalog boards — wallet minting is on the roadmap, not live yet.",
    "Top rarity tokens in the guide:",
    ...top.map(
      (token, index) =>
        `${index + 1}. ${token.symbol} — ${token.name} (${token.rarityTier}, score ${token.rarityScore})`,
    ),
    "See /tokens for the full guide and /value-trends for score movement.",
  ].join("\n");
}

function defaultAnswer(text: string): string {
  const matches = findKeyboardsByQuery(text);

  if (matches.length > 0) {
    return [
      "Here are the closest matches in the KeySol catalog:",
      listKeyboards(matches, 4),
      "Ask about speed rankings, wireless options, rapid trigger, or a specific brand.",
    ].join("\n\n");
  }

  return [
    "I can help with keyboard hardware questions using KeySol's catalog — speed rankings, switch types, layouts, wireless picks, and comparisons.",
    "Try asking:",
    "- What is the fastest keyboard?",
    "- Best keyboard under $200",
    "- Explain rapid trigger",
    "- Compare Wooting 60HE vs Razer Huntsman",
  ].join("\n");
}

export function generateLocalAssistantReply(message: string): string {
  const text = normalize(message);

  if (!text) {
    return "Ask me anything about keyboard hardware — rankings, switches, layouts, or a specific board in the catalog.";
  }

  if (isOffTopicMessage(text)) {
    return OFF_TOPIC_REPLY;
  }

  if (includesAny(text, ["token", "keysol token", "collectible", "rarity"])) {
    return answerTokens();
  }

  if (
    includesAny(text, [
      "switch type",
      "switch types",
      "what switch",
      "cherry mx",
      "gateron",
      "lekker",
      "omnipoint",
      "mgx",
      "magnetic switch",
      "optical switch",
    ])
  ) {
    const switchReply = answerSwitchType(text);
    if (switchReply) {
      return switchReply;
    }
  }

  if (includesAny(text, ["rapid trigger", "rapid-trigger", "rapidtrigger"])) {
    return explainRapidTrigger();
  }

  if (includesAny(text, ["polling rate", "polling", "8000 hz", "8k hz", "1000 hz"])) {
    return explainPollingRate();
  }

  if (includesAny(text, ["actuation", "actuation point"])) {
    return explainActuation();
  }

  if (
    includesAny(text, [
      "hall effect",
      "hall-effect",
      "magnetic switch",
      "magnetic keyboard",
      "he keyboard",
    ])
  ) {
    return explainHallEffect();
  }

  if (includesAny(text, ["cheapest", "budget", "affordable"]) || /under\s+\$?\s*\d+/.test(text)) {
    const budgetReply = answerBudget(text);
    if (budgetReply) {
      return budgetReply;
    }
    return answerCheapest();
  }

  if (
    includesAny(text, [
      "fastest",
      "best for gaming",
      "top keyboard",
      "speed ranking",
    ]) ||
    (text.includes("best keyboard") && !/under\s+\$?\s*\d+/.test(text))
  ) {
    return answerFastest();
  }

  if (includesAny(text, ["wireless", "bluetooth", "lightspeed"])) {
    return answerWireless();
  }

  if (includesAny(text, ["75%", "75 percent"])) {
    return answerLayout("75%");
  }

  if (includesAny(text, ["80%", "80 percent"])) {
    return answerLayout("80%");
  }

  if (includesAny(text, ["tkl", "tenkeyless"])) {
    return answerLayout("tkl");
  }

  if (includesAny(text, ["60%", "sixty percent", "mini"])) {
    return answerLayout("60%");
  }

  if (includesAny(text, ["full-size", "full size", "fullsize"])) {
    return answerLayout("full-size");
  }

  if (includesAny(text, ["compare", " vs ", "versus"])) {
    const compareReply = answerCompare(text);
    if (compareReply) {
      return compareReply;
    }
  }

  const brandReply = answerBrand(text);
  if (brandReply) {
    return brandReply;
  }

  const specificReply = answerSpecificKeyboard(text);
  if (specificReply) {
    return specificReply;
  }

  return defaultAnswer(text);
}

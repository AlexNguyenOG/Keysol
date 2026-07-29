"use client";

import Image from "next/image";
import type { Keyboard, TokenSnapshot } from "@/types";
import { getRarityTierForToken } from "@/lib/tokens/rarity";
import { AVAILABILITY_LABELS, AVAILABILITY_STYLES } from "@/lib/availability/labels";
import { getExplorerAddressUrl, getClusterShortLabel } from "@/lib/solana/cluster";
import { useTokenCollectibles } from "./TokenCollectiblesProvider";

interface CollectibleCardProps {
  snapshot: TokenSnapshot;
  keyboard?: Keyboard;
  dexNumber: number;
}

function typeChips(keyboard?: Keyboard): string[] {
  if (!keyboard) {
    return [];
  }

  const chips: string[] = [keyboard.stats.layout];
  const switchType = keyboard.stats.switchType.toLowerCase();
  if (
    switchType.includes("hall") ||
    switchType.includes("magnetic") ||
    switchType.includes("optical") ||
    switchType.includes("analog")
  ) {
    chips.push("HE / Analog");
  }
  if (keyboard.stats.rapidTrigger) {
    chips.push("Rapid trigger");
  }
  return chips.slice(0, 3);
}

function formatSupply(maxSupply: number): string {
  if (maxSupply >= 1000) {
    return `${Math.round(maxSupply / 100) / 10}k`;
  }
  return String(maxSupply);
}

export function CollectibleCard({
  snapshot,
  keyboard,
  dexNumber,
}: CollectibleCardProps) {
  const {
    enabled,
    connected,
    claimedIds,
    claimBusyKeyboardId,
    claimToken,
  } = useTokenCollectibles();

  const rarity = getRarityTierForToken(snapshot.token);
  const claimed = claimedIds.has(snapshot.keyboardId);
  const claimableEntry = enabled;
  const busy = claimBusyKeyboardId === snapshot.keyboardId;
  const imageSrc = keyboard?.image ?? "/keyboards/drop-placeholder.svg";
  const name =
    keyboard?.name ??
    (snapshot.token.name
      .replace(/^KeySol\s+/i, "")
      .replace(/\s+(Drop\s+)?Token$/i, "")
      .trim() ||
      snapshot.keyboardId);
  const chips = typeChips(keyboard);
  const stockStyles = AVAILABILITY_STYLES[snapshot.stockStatus];

  return (
    <article
      className={`collectible-card group relative flex flex-col overflow-hidden rounded-2xl border bg-bg-surface/90 transition duration-300 hover:-translate-y-1 ${rarity.borderClass} ${
        claimed ? "collectible-caught ring-1 ring-solana-green/30" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-primary">
        <Image
          src={imageSrc}
          alt={`${name} collectible art`}
          fill
          className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-bg-primary/80 px-2 py-0.5 font-mono text-[10px] text-text-muted backdrop-blur-sm">
          #{String(dexNumber).padStart(3, "0")}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${rarity.badgeClass}`}
        >
          {rarity.label}
        </span>
        {claimed ? (
          <span className="collectible-stamp absolute bottom-3 right-3 rounded-full border border-solana-green/40 bg-solana-green/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-solana-green backdrop-blur-sm">
            Caught
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="font-mono text-xs font-semibold text-solana-purple">
            {snapshot.token.symbol}
            {snapshot.token.mintAddress ? (
              <span className="ml-2 rounded-full border border-solana-green/30 bg-solana-green/10 px-1.5 py-0.5 text-[9px] uppercase text-solana-green">
                {getClusterShortLabel()}
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-text-primary">
            {name}
          </h3>
          <p className="mt-1 text-[11px] leading-snug text-text-muted">
            {rarity.catchHint}
          </p>
        </div>

        {chips.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/10 bg-bg-primary/60 px-2 py-0.5 text-[10px] text-text-muted"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${stockStyles.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stockStyles.dot}`} />
            {AVAILABILITY_LABELS[snapshot.stockStatus]}
          </span>
          <span className="font-mono text-[11px] text-text-muted">
            Cap {formatSupply(snapshot.token.maxSupply)}
          </span>
        </div>

        {snapshot.token.mintAddress ? (
          <a
            href={getExplorerAddressUrl(snapshot.token.mintAddress)}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-[10px] text-text-muted hover:text-solana-green"
            onClick={(event) => event.stopPropagation()}
          >
            mint
          </a>
        ) : null}

        {claimableEntry ? (
          <button
            type="button"
            disabled={busy || claimed || !connected}
            onClick={() => {
              void claimToken(snapshot.keyboardId);
            }}
            className="mt-auto w-full rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-3 py-2 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            title={
              !connected
                ? "Connect a wallet to claim"
                : claimed
                  ? "Already in your collection"
                  : "Claim this collectible"
            }
          >
            {busy
              ? "Claiming…"
              : claimed
                ? "Caught"
                : connected
                  ? "Claim"
                  : "Connect to claim"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Keyboard } from "@/types";
import { KeyboardCard } from "./KeyboardCard";

interface BrandKeyboardListProps {
  brandName: string;
  keyboards: Keyboard[];
  remaining: number;
}

export function BrandKeyboardList({
  brandName,
  keyboards,
  remaining,
}: BrandKeyboardListProps) {
  const defaultExpandedId = keyboards[0]?.id ?? null;
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId);
  const [riseKey, setRiseKey] = useState(0);
  const previousExpandedId = useRef(defaultExpandedId);
  const activeId = expandedId ?? defaultExpandedId;

  useEffect(() => {
    if (activeId && activeId !== previousExpandedId.current) {
      setRiseKey((current) => current + 1);
      previousExpandedId.current = activeId;
    }
  }, [activeId]);

  if (keyboards.length === 0) {
    return null;
  }

  const ordered = [...keyboards].sort((a, b) => {
    if (a.id === activeId) {
      return -1;
    }
    if (b.id === activeId) {
      return 1;
    }
    return 0;
  });

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Fastest keyboards
        </p>
        <span className="text-xs text-text-muted">
          {keyboards.length + remaining} in catalog
        </span>
      </div>

      <div className="space-y-3">
        {ordered.map((keyboard) => {
          const isExpanded = keyboard.id === activeId;

          return (
            <div
              key={keyboard.id}
              onClick={() => setExpandedId(keyboard.id)}
              className={`will-change-transform ${
                isExpanded
                  ? "relative z-10"
                  : "cursor-pointer opacity-90 hover:opacity-100"
              }`}
            >
              <div
                key={
                  isExpanded
                    ? `rise-${keyboard.id}-${riseKey}`
                    : `settle-${keyboard.id}`
                }
                className={isExpanded ? "keyboard-rise" : "keyboard-settle"}
              >
                <KeyboardCard
                  keyboard={keyboard}
                  variant={isExpanded ? "full" : "compact"}
                />
              </div>
            </div>
          );
        })}
      </div>

      {remaining > 0 && (
        <p className="text-center text-sm text-text-muted">
          +{remaining} more {brandName} keyboard
          {remaining === 1 ? "" : "s"} on{" "}
          <Link
            href="/rankings"
            className="text-solana-green underline-offset-2 hover:underline"
          >
            rankings
          </Link>
        </p>
      )}
    </div>
  );
}

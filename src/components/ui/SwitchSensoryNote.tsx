import type { SwitchTypeEntry } from "@/data/switch-types";

interface SwitchSensoryNoteProps {
  entry: SwitchTypeEntry;
  className?: string;
}

export function SwitchSensoryNote({ entry, className = "" }: SwitchSensoryNoteProps) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-gradient-to-br from-solana-purple/8 via-bg-primary/40 to-solana-green/8 px-3 py-2.5 ${className}`}
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-solana-purple">
            Sound
          </p>
          <p className="text-xs leading-relaxed text-text-muted">{entry.sound}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-solana-green">
            Feel
          </p>
          <p className="text-xs leading-relaxed text-text-muted">{entry.feel}</p>
        </div>
      </div>
    </div>
  );
}

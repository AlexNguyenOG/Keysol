import { keyboards } from "@/data/keyboards";
import {
  switchCategories,
  switchTypes,
  type SwitchCategoryId,
} from "@/data/switch-types";

function keyboardName(id: string): string {
  return keyboards.find((keyboard) => keyboard.id === id)?.name ?? id;
}

const categoryOrder: SwitchCategoryId[] = [
  "hall-effect",
  "magnetic",
  "optical",
  "mechanical",
  "low-profile",
];

function CategoryBadge({
  label,
  accentClass,
}: {
  label: string;
  accentClass: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${accentClass}`}
    >
      {label}
    </span>
  );
}

interface SwitchTypesGuideProps {
  variant?: "sidebar" | "full";
  className?: string;
}

export function SwitchTypesGuide({
  variant = "full",
  className = "",
}: SwitchTypesGuideProps) {
  const isSidebar = variant === "sidebar";

  return (
    <aside
      className={`gradient-border rounded-2xl ${isSidebar ? "p-4" : "p-6 sm:p-8"} ${className}`}
      aria-labelledby="switch-guide-title"
    >
      <div className={isSidebar ? "mb-4" : "mb-8 text-center lg:text-left"}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solana-green">
          Reference
        </p>
        <h3
          id="switch-guide-title"
          className={`font-bold tracking-tight text-text-primary ${isSidebar ? "mt-1 text-lg" : "mt-2 text-2xl sm:text-3xl"}`}
        >
          Switch Technology Guide
        </h3>
        <p
          className={`mt-2 text-text-muted ${isSidebar ? "text-xs leading-relaxed" : "text-sm leading-relaxed sm:max-w-2xl"}`}
        >
          Every keyboard in KeySol uses one of these switch families. Compare
          how they work, who they&apos;re for, and which boards in our catalog
          ship with each type.
        </p>
      </div>

      <div
        className={`${isSidebar ? "max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto pr-1" : "space-y-10"}`}
      >
        {categoryOrder.map((categoryId) => {
          const category = switchCategories.find(
            (entry) => entry.id === categoryId,
          );
          const entries = switchTypes.filter(
            (entry) => entry.categoryId === categoryId,
          );

          if (!category || entries.length === 0) {
            return null;
          }

          return (
            <section key={categoryId} className="space-y-3">
              <div className="space-y-2">
                <CategoryBadge
                  label={category.name}
                  accentClass={category.accentClass}
                />
                <p
                  className={`leading-relaxed text-text-muted ${isSidebar ? "text-xs" : "text-sm"}`}
                >
                  {category.summary}
                </p>
              </div>

              <div
                className={
                  isSidebar
                    ? "space-y-3"
                    : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                }
              >
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-white/10 bg-bg-primary/50 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4
                          className={`font-semibold text-text-primary ${isSidebar ? "text-sm" : "text-base"}`}
                        >
                          {entry.name}
                        </h4>
                        <p className="text-xs text-solana-purple">
                          {entry.tagline}
                        </p>
                      </div>
                      {entry.rapidTrigger && (
                        <span className="shrink-0 rounded-full bg-solana-green/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-solana-green">
                          RT
                        </span>
                      )}
                    </div>

                    <p
                      className={`mb-3 leading-relaxed text-text-muted ${isSidebar ? "text-xs" : "text-sm"}`}
                    >
                      {entry.howItWorks}
                    </p>

                    <dl
                      className={`mb-3 grid gap-2 ${isSidebar ? "text-xs" : "text-sm"}`}
                    >
                      <div className="rounded-lg border border-white/5 bg-bg-surface/80 px-3 py-2">
                        <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                          Actuation
                        </dt>
                        <dd className="mt-0.5 font-medium text-solana-green">
                          {entry.actuation}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-bg-surface/80 px-3 py-2">
                        <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                          Best for
                        </dt>
                        <dd className="mt-0.5 text-text-primary">
                          {entry.bestFor}
                        </dd>
                      </div>
                    </dl>

                    {!isSidebar && (
                      <div className="mb-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                            Strengths
                          </p>
                          <ul className="space-y-1">
                            {entry.strengths.map((item) => (
                              <li
                                key={item}
                                className="flex gap-2 text-xs text-text-muted"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-solana-green" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                            Tradeoffs
                          </p>
                          <ul className="space-y-1">
                            {entry.tradeoffs.map((item) => (
                              <li
                                key={item}
                                className="flex gap-2 text-xs text-text-muted"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        In KeySol catalog
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.keyboardIds.map((id) => (
                          <span
                            key={id}
                            className="rounded-md border border-white/10 bg-bg-surface px-2 py-1 text-[11px] text-text-primary"
                          >
                            {keyboardName(id)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {!isSidebar && (
        <div className="mt-10 overflow-x-auto rounded-xl border border-white/10 bg-bg-primary/40">
          <table className="min-w-full text-left text-sm">
            <caption className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              At-a-glance comparison
            </caption>
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Technology</th>
                <th className="px-4 py-3 font-medium">Contact?</th>
                <th className="px-4 py-3 font-medium">Adjustable</th>
                <th className="px-4 py-3 font-medium">Rapid trigger</th>
                <th className="px-4 py-3 font-medium">Speed tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-muted">
              <tr>
                <td className="px-4 py-3 font-medium text-text-primary">
                  Hall-Effect
                </td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3">S-tier</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-text-primary">
                  Magnetic adjustable
                </td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3">S-tier</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-text-primary">
                  Optical analog
                </td>
                <td className="px-4 py-3">No (light)</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3">S-tier</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-text-primary">
                  Mechanical speed
                </td>
                <td className="px-4 py-3">Yes</td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3">A-tier</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-text-primary">
                  Low-profile magnetic
                </td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3 text-solana-green">Yes</td>
                <td className="px-4 py-3">S-tier (slim)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </aside>
  );
}

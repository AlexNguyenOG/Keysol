import { SwitchTypesGuide } from "@/components/home/SwitchTypesGuide";

export function SwitchTypesGuideSection() {
  return (
    <section
      id="switch-guide"
      className="border-t border-white/10 bg-bg-surface px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SwitchTypesGuide variant="full" />
      </div>
    </section>
  );
}

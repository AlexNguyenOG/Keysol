const topics = [
  {
    title: "Switch Types",
    description:
      "Mechanical, optical, and hall-effect switches each offer different feel, sound, and performance. The right switch depends on whether you prioritize speed, tactility, or silence.",
  },
  {
    title: "Latency Matters",
    description:
      "For competitive gaming, input lag can mean the difference between winning and losing. Hall-effect and optical switches often deliver the fastest actuation times.",
  },
  {
    title: "Build Quality",
    description:
      "Premium materials like aluminum frames and thick PBT keycaps improve durability and typing feel. A solid board lasts years and holds its value.",
  },
];

export function WhySection() {
  return (
    <section id="about" className="border-t border-white/10 bg-bg-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Keyboards Matter
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted">
            Your keyboard is the interface between you and your work, games, and
            creativity. Here&apos;s what to look for when choosing one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {topics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-2xl border border-white/10 bg-bg-primary/50 p-6 backdrop-blur-sm"
            >
              <h3 className="mb-3 text-lg font-semibold text-text-primary">
                {topic.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                {topic.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

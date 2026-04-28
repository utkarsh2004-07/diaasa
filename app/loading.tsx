export default function Loading() {
  return (
    <div className="fixed inset-0 bg-cream-50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <span className="font-display text-3xl font-light tracking-[0.3em] text-charcoal-900 animate-pulse-soft">
          DIAASA
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce-soft"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

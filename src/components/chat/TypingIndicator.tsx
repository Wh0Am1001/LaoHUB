export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulseDot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

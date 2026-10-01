// Five stars filled to the given rating, e.g. 3.5 fills three and a half.
export function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  const percent = Math.max(0, Math.min(5, rating)) * 20;
  return (
    <span className={`relative inline-block leading-none ${size}`} aria-label={`${rating} out of 5`}>
      <span className="text-neutral-300">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden text-amber-400"
        style={{ width: `${percent}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

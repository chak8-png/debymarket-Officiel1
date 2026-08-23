/**
 * DotWave — indicateur de chargement « vague de points » (style ldrs dotWave).
 * Réécrit en pur CSS : aucune dépendance, aucun JS côté client.
 * Couleurs par défaut : charte Debymarket (bleu brand + vert).
 */
export default function DotWave({
  size = 12,
  colors = ["#2563eb", "#16a34a", "#2563eb"],
  label,
  className = "",
}: {
  /** Diamètre d'un point, en pixels */
  size?: number;
  /** Couleurs des 3 points */
  colors?: string[];
  /** Texte affiché sous les points (optionnel) */
  label?: string;
  className?: string;
}) {
  const gap = Math.max(4, Math.round(size * 0.55));
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ gap, height: size * 2.4 }}
      >
        {colors.slice(0, 3).map((color, i) => (
          <span
            key={i}
            className="dot-wave-dot rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              animationDelay: `${(i - 2) * 0.12}s`,
            }}
          />
        ))}
      </div>
      {label ? (
        <p className="mt-3 text-sm font-medium text-gray-400">{label}</p>
      ) : null}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}

import DotWave from "@/frontend/components/ui/DotWave";

/**
 * Écran affiché automatiquement par Next.js pendant le chargement
 * d'une page (navigation, données base de données, etc.).
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-cream px-4">
      <p className="mb-6 text-xs font-bold uppercase tracking-[0.35em] text-brand-600">
        Debymarket
      </p>
      <DotWave size={14} />
    </div>
  );
}

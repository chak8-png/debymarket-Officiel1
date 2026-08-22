import { DELIVERY_TIME } from "@/backend/lib/constants";

export default function PaymentBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        💵 Paiement à la livraison
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
        🚚 Livraison en {DELIVERY_TIME}
      </span>
      {!compact && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          📦 Colis discret
        </span>
      )}
    </div>
  );
}

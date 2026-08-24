"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/backend/lib/constants";

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: number;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onChange = async (next: OrderStatus) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-brand-500 disabled:opacity-50"
      aria-label="Statut de la commande"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

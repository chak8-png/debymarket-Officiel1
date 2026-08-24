"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginView() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Erreur de connexion.");
    } catch {
      setError("Connexion impossible, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <form
        onSubmit={submit}
        className="space-y-4 rounded-3xl border bg-white p-8 shadow-sm"
      >
        <div className="text-center">
          <span className="text-4xl">🔐</span>
          <h1 className="mt-2 text-xl font-display font-semibold tracking-tight">Espace administrateur</h1>
          <p className="text-sm text-gray-500">Accès réservé à l&apos;équipe Debymarket</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 py-3 font-bold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { CartProvider } from "../components/cart/CartProvider";
import CartDrawer from "../components/cart/CartDrawer";

/** Regroupe tous les context providers client de l'application. */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}

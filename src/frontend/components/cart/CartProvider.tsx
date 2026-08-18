"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { deliveryFeeFor } from "@/backend/lib/constants";

export interface CartItem {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  imageUrl?: string | null;
  quantity: number;
}

export interface AddableProduct {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  imageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isOpen: boolean;
  addItem: (product: AddableProduct, quantity?: number) => void;
  removeItem: (id: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "debymarket_cart_v1";
const MAX_QTY = 20;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restaure le panier depuis localStorage au chargement
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // panier corrompu → on repart de zéro
    }
    setHydrated(true);
  }, []);

  // Persiste à chaque modification
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = (product, quantity = 1) =>
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id
              ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
              : i
          );
        }
        return [...prev, { ...product, quantity }];
      });

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = deliveryFeeFor(subtotal, items.length);

    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      isOpen,
      addItem,
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      setQuantity: (id, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.id !== id)
            : prev.map((i) =>
                i.id === id ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i
              )
        ),
      clear: () => setItems([]),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>");
  return ctx;
}

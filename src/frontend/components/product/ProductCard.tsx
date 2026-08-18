import Link from "next/link";
import type { Product } from "@/backend/db/schema";
import { formatXOF } from "@/backend/lib/format";
import Stars from "../ui/Stars";
import AddToCart from "./AddToCart";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-sand">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-110"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-7xl transition-transform duration-300 group-hover:scale-110">
              {product.image}
            </span>
          )}
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink-700 backdrop-blur">
            Plus que {product.stock}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-ink-800 transition hover:text-brand-600"
        >
          {product.name}
        </Link>
        <Stars rating={product.rating} />

        <div className="mt-auto flex items-end justify-between pt-2">
          <p className="text-base font-bold text-ink-950">
            {formatXOF(product.price)}
          </p>
          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              oldPrice: product.oldPrice,
              image: product.image,
              imageUrl: product.imageUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}

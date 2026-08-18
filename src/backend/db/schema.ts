import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Catégories — jusqu'à 3 niveaux via parent_id (ex: Mode > Homme > Chemise & Polo)
// ---------------------------------------------------------------------------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  parentId: integer("parent_id"), // auto-référence → categories.id
  depth: integer("depth").notNull().default(0), // 0 = univers, 1 = catégorie, 2 = sous-catégorie
  icon: text("icon"), // emoji d'affichage
  position: integer("position").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Produits — prix EN ENTIERS (FCFA), jamais en flottants
// ---------------------------------------------------------------------------
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  oldPrice: integer("old_price"), // prix barré si promo
  stock: integer("stock").notNull().default(0),
  image: text("image").notNull().default("🛍️"), // emoji (visuel de secours)
  imageUrl: text("image_url"), // photo du produit (optionnelle)
  categoryId: integer("category_id").notNull(),
  rating: integer("rating").notNull().default(4), // 0-5
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Commandes — paiement à la livraison uniquement
// ---------------------------------------------------------------------------
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("pending"), // pending → confirmed → shipped → delivered
  paymentMethod: text("payment_method").notNull().default("cash_on_delivery"),
  paymentStatus: text("payment_status").notNull().default("to_pay_on_delivery"),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(), // snapshot du nom au moment de l'achat
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // snapshot du prix au moment de l'achat
});

// ---------------------------------------------------------------------------
// Réglages du site — paires clé/valeur (ex : images d'accueil personnalisées
// depuis le dashboard). Stocké en base → fonctionne aussi en serverless.
// ---------------------------------------------------------------------------
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Setting = typeof settings.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

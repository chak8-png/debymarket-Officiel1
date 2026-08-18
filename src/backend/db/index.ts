import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Client PostgreSQL + Drizzle.
// Sans DATABASE_URL, db vaut null → le site bascule en "mode démo"
// (données en mémoire, voir backend/lib/products.ts et services/orders.ts).
const url = process.env.DATABASE_URL;

export const db = url
  ? drizzle(postgres(url, { prepare: false }), { schema })
  : null;

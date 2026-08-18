// Route : /api/admin/settings — aiguillage vers backend/handlers.
// force-dynamic : les réglages doivent toujours refléter la valeur courante.
export const dynamic = "force-dynamic";

export { GET, POST } from "@/backend/handlers/admin/settings";

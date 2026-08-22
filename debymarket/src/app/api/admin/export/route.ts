// Route : GET /api/admin/export — aiguillage, la logique est dans backend/handlers.
// ⚠️ force-dynamic obligatoire : sinon Next.js fige la réponse GET au build
// (l'export renverrait éternellement l'Excel vide du moment du build).
export const dynamic = "force-dynamic";

export { GET } from "@/backend/handlers/admin/export";

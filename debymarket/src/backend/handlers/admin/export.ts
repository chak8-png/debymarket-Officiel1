// Handler : GET /api/admin/export — génère l'historique des transactions en Excel (.xlsx)
// 3 onglets structurés : ① Résumé  ② Transactions  ③ Articles vendus
// (protégé par middleware.ts)
import ExcelJS from "exceljs";
import { listOrders } from "@/backend/services/orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/backend/lib/constants";
import type { StoredOrder } from "@/backend/services/orders";

// ---------------------------------------------------------------------------
// Mise en forme commune
// ---------------------------------------------------------------------------
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D4ED8" }, // bleu marque
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD9D9D9" } },
  bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
  left: { style: "thin", color: { argb: "FFD9D9D9" } },
  right: { style: "thin", color: { argb: "FFD9D9D9" } },
};
const FCFA_FORMAT = '#,##0" FCFA"';

// ---------------------------------------------------------------------------
// ⚠️ SÉCURITÉ — anti INJECTION DE FORMULES Excel/CSV.
// Un client malveillant peut passer commande avec un nom du type
// « =CMD|'/c calc'!A1 » ou « =LIEN_HYPERTEXTE(http://…) » : à l'ouverture du
// fichier, Excel interprèterait la cellule comme une formule (exécution de
// commande / hameçonnage). On neutralise donc tout texte commençant par
// = + - @ (et on retire les caractères de contrôle) AVANT écriture.
// ---------------------------------------------------------------------------
function safeText(value: string): string {
  // Retire les caractères de contrôle (NUL, tabulation initiale, CR/LF en
  // début de cellule) qui peuvent aussi déclencher l'interprétation.
  let s = value.replace(/[\u0000-\u001F\u007F]/g, "");
  if (/^[\s]*[=+\-@]/.test(s)) {
    // Apostrophe préfixe : Excel affiche le texte tel quel, sans l'évaluer.
    s = `'${s}`;
  }
  return s;
}

function styleHeaderRow(ws: ExcelJS.Worksheet) {
  const row = ws.getRow(1);
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  ws.views = [{ state: "frozen", ySplit: 1 }]; // ligne d'en-tête figée
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columnCount },
  };
}

const fmtDate = (d: Date) =>
  new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ---------------------------------------------------------------------------
// Onglet 1 : Résumé
// ---------------------------------------------------------------------------
function buildSummarySheet(wb: ExcelJS.Workbook, orders: StoredOrder[]) {
  const ws = wb.addWorksheet("Résumé", {
    properties: { tabColor: { argb: "FF16A34A" } },
  });
  ws.columns = [{ width: 38 }, { width: 22 }];

  const paid = orders.filter((o) => o.paymentStatus === "paid");
  const pending = orders.filter((o) => o.status === "pending");
  const inDelivery = orders.filter(
    (o) => o.status === "confirmed" || o.status === "shipped"
  );

  const title = ws.getCell("A1");
  title.value = "📊 Debymarket — Résumé des transactions";
  title.font = { bold: true, size: 14, color: { argb: "FF1D4ED8" } };
  ws.getCell("A2").value = `Export du ${fmtDate(new Date())}`;
  ws.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  const rows: [string, string | number][] = [
    ["", ""],
    ["Total commandes", orders.length],
    ["Commandes en attente", pending.length],
    ["En cours de livraison", inDelivery.length],
    [
      "Commandes livrées (payées)",
      orders.filter((o) => o.status === "delivered").length,
    ],
    ["Annulées / retournées", orders.filter((o) => o.status === "cancelled" || o.status === "returned").length],
    ["", ""],
    ["💵 CA encaissé (commandes livrées)", paid.reduce((s, o) => s + o.total, 0)],
    [
      "⏳ En attente d'encaissement",
      orders
        .filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled" && o.status !== "returned")
        .reduce((s, o) => s + o.total, 0),
    ],
    ["📦 Total articles vendus", orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0)],
    ["🚚 Total frais de livraison", orders.reduce((s, o) => s + o.deliveryFee, 0)],
  ];

  rows.forEach(([label, value], i) => {
    const r = 3 + i;
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`B${r}`).value = value;
    ws.getCell(`A${r}`).font = { bold: true };
    ws.getCell(`A${r}`).border = THIN_BORDER;
    ws.getCell(`B${r}`).border = THIN_BORDER;
    if (typeof value === "number" && label.includes("FCFA") === false && label.includes("💵") === false && label.includes("⏳") === false && label.includes("🚚") === false) return;
    if (typeof value === "number") ws.getCell(`B${r}`).numFmt = FCFA_FORMAT;
  });

  // Montants en gras vert/ambre
  const moneyStart = 3 + rows.findIndex(([l]) => l === "💵 CA encaissé (commandes livrées)");
  ws.getCell(`B${moneyStart}`).font = { bold: true, color: { argb: "FF16A34A" } };
  ws.getCell(`B${moneyStart + 1}`).font = { bold: true, color: { argb: "FFD97706" } };
}

// ---------------------------------------------------------------------------
// Onglet 2 : Transactions (une ligne par commande)
// ---------------------------------------------------------------------------
function buildTransactionsSheet(wb: ExcelJS.Workbook, orders: StoredOrder[]) {
  const ws = wb.addWorksheet("Transactions", {
    properties: { tabColor: { argb: "FF1D4ED8" } },
  });

  ws.columns = [
    { header: "Référence", key: "reference", width: 22 },
    { header: "Date", key: "date", width: 18 },
    { header: "Client", key: "customer", width: 22 },
    { header: "Téléphone", key: "phone", width: 16 },
    { header: "Ville / Commune", key: "city", width: 18 },
    { header: "Adresse de livraison", key: "address", width: 30 },
    { header: "Articles", key: "items", width: 42 },
    { header: "Sous-total", key: "subtotal", width: 15, style: { numFmt: FCFA_FORMAT } },
    { header: "Livraison", key: "deliveryFee", width: 14, style: { numFmt: FCFA_FORMAT } },
    { header: "Total", key: "total", width: 15, style: { numFmt: FCFA_FORMAT } },
    { header: "Paiement", key: "paymentStatus", width: 20 },
    { header: "Statut", key: "status", width: 14 },
  ];
  styleHeaderRow(ws);

  orders.forEach((o) => {
    const row = ws.addRow({
      reference: safeText(o.reference),
      date: fmtDate(o.createdAt),
      // Champs saisis par le client → neutralisés (anti injection de formules)
      customer: safeText(o.customerName),
      phone: safeText(o.phone),
      city: safeText(o.city),
      address: safeText(o.address),
      items: safeText(
        o.items
          .map(
            (i) =>
              `${i.quantity}× ${i.name}` +
              `${i.variant || i.size ? ` (${[i.variant, i.size].filter(Boolean).join(" / ")})` : ""}`
          )
          .join(" | ")
      ),
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      paymentStatus:
        o.paymentStatus === "paid" ? "Payé à la livraison" : "À payer à la livraison",
      status: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status,
    });
    row.eachCell((cell) => (cell.border = THIN_BORDER));
    row.getCell("total").font = { bold: true, color: { argb: "FF1D4ED8" } };
    row.getCell("items").alignment = { wrapText: true, vertical: "top" };
    row.getCell("address").alignment = { wrapText: true, vertical: "top" };
    // Couleur du statut paiement
    const payCell = row.getCell("paymentStatus");
    payCell.font = {
      bold: true,
      color: { argb: o.paymentStatus === "paid" ? "FF16A34A" : "FFD97706" },
    };
  });
}

// ---------------------------------------------------------------------------
// Onglet 3 : Articles vendus (une ligne par article de commande)
// ---------------------------------------------------------------------------
function buildItemsSheet(wb: ExcelJS.Workbook, orders: StoredOrder[]) {
  const ws = wb.addWorksheet("Articles vendus", {
    properties: { tabColor: { argb: "FFF97316" } },
  });

  ws.columns = [
    { header: "Référence commande", key: "reference", width: 22 },
    { header: "Date", key: "date", width: 18 },
    { header: "Article", key: "name", width: 36 },
    { header: "Couleur", key: "variant", width: 14 },
    { header: "Taille / Pointure", key: "size", width: 16 },
    { header: "Quantité", key: "quantity", width: 10 },
    { header: "Prix unitaire", key: "unitPrice", width: 16, style: { numFmt: FCFA_FORMAT } },
    { header: "Montant", key: "amount", width: 16, style: { numFmt: FCFA_FORMAT } },
  ];
  styleHeaderRow(ws);

  for (const o of orders) {
    for (const item of o.items) {
      const row = ws.addRow({
        reference: safeText(o.reference),
        date: fmtDate(o.createdAt),
        name: safeText(item.name),
        variant: item.variant ? safeText(item.variant) : "—",
        size: item.size ? safeText(item.size) : "—",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.unitPrice * item.quantity,
      });
      row.eachCell((cell) => (cell.border = THIN_BORDER));
      row.getCell("quantity").alignment = { horizontal: "center" };
      row.getCell("amount").font = { bold: true };
    }
  }

  // Ligne total en bas
  const totalRow = ws.addRow({
    name: "TOTAL",
    quantity: orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0),
    amount: orders.reduce(
      (s, o) => s + o.items.reduce((ss, i) => ss + i.unitPrice * i.quantity, 0),
      0
    ),
  });
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12, color: { argb: "FF16A34A" } };
    cell.border = THIN_BORDER;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
  });
}

// ---------------------------------------------------------------------------
// GET — génère et renvoie le fichier Excel
// ---------------------------------------------------------------------------
export async function GET() {
  const orders = await listOrders();

  const wb = new ExcelJS.Workbook();
  wb.creator = "Debymarket";
  wb.created = new Date();

  buildSummarySheet(wb, orders);
  buildTransactionsSheet(wb, orders);
  buildItemsSheet(wb, orders);

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `debymarket-transactions-${stamp}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

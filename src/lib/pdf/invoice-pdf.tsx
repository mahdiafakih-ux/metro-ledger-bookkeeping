import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCents } from "@/lib/money";
import { formatDate, titleCase } from "@/lib/utils";

type Invoice = any;
type InvoiceItem = any;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a2138" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { fontSize: 16, fontWeight: 700, color: "#1a2138" },
  brandAccent: { color: "#2354eb" },
  invoiceTitle: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  invoiceNumber: { fontSize: 10, color: "#64749f", textAlign: "right", marginTop: 2 },
  statusBadge: { fontSize: 9, color: "#2354eb", textAlign: "right", marginTop: 6, fontWeight: 700 },
  addressGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  addressLabel: { fontSize: 8, fontWeight: 700, color: "#94a1c4", textTransform: "uppercase", letterSpacing: 0.5 },
  addressName: { fontSize: 11, fontWeight: 700, marginTop: 4 },
  addressLine: { fontSize: 9.5, color: "#64749f", marginTop: 2 },
  dateBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f4f6fb",
    padding: 10,
    borderRadius: 6,
    marginTop: 20,
  },
  dateText: { fontSize: 9.5, color: "#1a2138" },
  dateLabel: { color: "#94a1c4" },
  table: { marginTop: 24 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#c9d1e8", paddingBottom: 6 },
  tableHeaderCell: { fontSize: 8, fontWeight: 700, color: "#94a1c4", textTransform: "uppercase" },
  sectionLabel: { fontSize: 8, fontWeight: 700, color: "#94a1c4", textTransform: "uppercase", marginTop: 12, marginBottom: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eef0f7", paddingVertical: 6 },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colAmount: { flex: 1, textAlign: "right", fontWeight: 700 },
  totalsBlock: { alignItems: "flex-end", marginTop: 16 },
  totalsRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginTop: 3 },
  totalsLabel: { color: "#64749f" },
  totalsValue: { fontWeight: 600 },
  totalsFinalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#c9d1e8",
  },
  totalsFinalLabel: { fontWeight: 700, fontSize: 11 },
  totalsFinalValue: { fontWeight: 700, fontSize: 11 },
  notesBlock: { marginTop: 24, backgroundColor: "#f4f6fb", padding: 10, borderRadius: 6 },
  disclosure: { marginTop: 28, fontSize: 7.5, color: "#94a1c4", lineHeight: 1.4 },
});

interface InvoicePdfProps {
  invoice: Invoice & { items: InvoiceItem[] };
  business: { businessName: string; email: string; phone: string };
}

export function InvoicePdfDocument({ invoice, business }: InvoicePdfProps) {
  const statutoryItems = invoice.items.filter((i: any) => i.type === "statutory_fee");
  const otherItems = invoice.items.filter((i: any) => i.type !== "statutory_fee");
  const subtotal = invoice.items.reduce((sum: number, i: any) => sum + i.amountCents, 0);
  const total = subtotal + invoice.taxCents;
  const balanceDueCents = total - invoice.amountPaidCents;

  return (
    <Document title={`Invoice ${invoice.invoiceNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            Notar-E <Text style={styles.brandAccent}>Services</Text>
          </Text>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{titleCase(invoice.status)}</Text>
          </View>
        </View>

        <View style={styles.addressGrid}>
          <View>
            <Text style={styles.addressLabel}>Bill To</Text>
            <Text style={styles.addressName}>{invoice.clientName}</Text>
            {invoice.company ? <Text style={styles.addressLine}>{invoice.company}</Text> : null}
          </View>
          <View>
            <Text style={styles.addressLabel}>From</Text>
            <Text style={styles.addressName}>{business.businessName}</Text>
            <Text style={styles.addressLine}>{business.email}</Text>
            <Text style={styles.addressLine}>{business.phone}</Text>
          </View>
        </View>

        <View style={styles.dateBar}>
          <Text style={styles.dateText}><Text style={styles.dateLabel}>Issue Date: </Text>{formatDate(invoice.issueDate)}</Text>
          <Text style={styles.dateText}><Text style={styles.dateLabel}>Due Date: </Text>{formatDate(invoice.dueDate)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {statutoryItems.length > 0 && (
            <Text style={styles.sectionLabel}>Statutory Notarial Fees (MCL 55.285 — max $10/act)</Text>
          )}
          {statutoryItems.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatCents(item.unitAmountCents)}</Text>
              <Text style={styles.colAmount}>{formatCents(item.amountCents)}</Text>
            </View>
          ))}

          {otherItems.length > 0 && <Text style={styles.sectionLabel}>Other Lawful Services</Text>}
          {otherItems.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatCents(item.unitAmountCents)}</Text>
              <Text style={styles.colAmount}>{formatCents(item.amountCents)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatCents(subtotal)}</Text>
          </View>
          {invoice.taxCents > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>{formatCents(invoice.taxCents)}</Text>
            </View>
          )}
          <View style={styles.totalsFinalRow}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>{formatCents(total)}</Text>
          </View>
          {invoice.amountPaidCents > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Paid</Text>
              <Text style={styles.totalsValue}>-{formatCents(invoice.amountPaidCents)}</Text>
            </View>
          )}
          <View style={styles.totalsFinalRow}>
            <Text style={styles.totalsFinalLabel}>Balance Due</Text>
            <Text style={styles.totalsFinalValue}>{formatCents(Math.max(0, balanceDueCents))}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.addressLabel}>Notes</Text>
            <Text style={{ marginTop: 4 }}>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.disclosure}>
          Notar-E Services is not a law firm and does not provide legal advice. Statutory notarial fees are
          limited to $10 per notarial act under Michigan law (MCL 55.285). Other charges reflect separately
          disclosed, lawful business services.
        </Text>
      </Page>
    </Document>
  );
}

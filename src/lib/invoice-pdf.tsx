import type { InvoiceType } from "@prisma/client";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { inrAmountToWords } from "@/lib/invoice-amount-words";

export type InvoiceLinePdf = {
  idx: number;
  description: string;
  hsn: string;
  qty: number;
  unitPrice: number;
  amount: number;
};

export type RentfoxxyInvoicePdfProps = {
  docType: InvoiceType;
  invoiceNumber: string;
  issuedAt: Date;
  orderRef?: string;
  originalInvoiceNumber?: string;
  company: {
    name: string;
    address: string;
    gstin: string;
    pan: string;
    email: string;
    phone: string;
  };
  customer: {
    name: string;
    companyName: string | null;
    gstin: string | null;
  };
  shipTo: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: InvoiceLinePdf[];
  taxableSubtotal: number;
  isInterState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  jurisdictionNote: string;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#0f172a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f2d5e" },
  meta: { textAlign: "right", fontSize: 9 },
  typeLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  box: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 8,
    marginBottom: 10,
    borderRadius: 2,
  },
  boxTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4, fontSize: 9 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 4 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#94a3b8", paddingBottom: 4, fontFamily: "Helvetica-Bold" },
  col1: { width: "6%" },
  col2: { width: "34%" },
  col3: { width: "12%" },
  col4: { width: "10%", textAlign: "right" },
  col5: { width: "16%", textAlign: "right" },
  col6: { width: "12%", textAlign: "right" },
  col7: { width: "10%", textAlign: "right" },
  totals: { marginTop: 10, alignSelf: "flex-end", width: "55%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  words: { marginTop: 10, fontSize: 8, fontStyle: "italic", color: "#334155" },
  footer: { marginTop: 24, fontSize: 8, color: "#64748b", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8 },
});

function typeTitle(t: InvoiceType): string {
  if (t === "PROFORMA") return "PROFORMA INVOICE";
  if (t === "CREDIT_NOTE") return "CREDIT NOTE";
  return "TAX INVOICE";
}

export function RentfoxxyInvoicePdf(props: RentfoxxyInvoicePdfProps) {
  const words = inrAmountToWords(props.grandTotal);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>RENTFOXXY</Text>
            <Text style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{props.company.name}</Text>
            <Text style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{props.company.address}</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>
              GSTIN: {props.company.gstin || "—"} · PAN: {props.company.pan || "—"}
            </Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              {props.company.email ? `${props.company.email} · ` : ""}
              {props.company.phone || ""}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.typeLabel}>{typeTitle(props.docType)}</Text>
            <Text style={{ marginTop: 6 }}>Invoice #: {props.invoiceNumber}</Text>
            <Text>Date: {props.issuedAt.toLocaleDateString("en-IN")}</Text>
            {props.orderRef ? <Text>Order ref: {props.orderRef}</Text> : null}
            {props.originalInvoiceNumber ? (
              <Text>Original invoice: {props.originalInvoiceNumber}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Bill To</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            {props.customer.name}
            {props.customer.companyName ? ` · ${props.customer.companyName}` : ""}
          </Text>
          {props.customer.gstin ? <Text>GSTIN / UIN: {props.customer.gstin}</Text> : null}
          <Text style={{ marginTop: 4 }}>
            {props.shipTo.line1}
            {props.shipTo.line2 ? `, ${props.shipTo.line2}` : ""}
          </Text>
          <Text>
            {props.shipTo.city}, {props.shipTo.state} {props.shipTo.pincode}
          </Text>
        </View>

        <View style={[styles.box, { marginBottom: 6 }]}>
          <Text style={styles.boxTitle}>Place of supply</Text>
          <Text>
            {props.shipTo.state} ({props.isInterState ? "Inter-state supply — IGST" : "Intra-state supply — CGST + SGST"})
          </Text>
        </View>

        <View style={styles.th}>
          <Text style={styles.col1}>#</Text>
          <Text style={styles.col2}>Description</Text>
          <Text style={styles.col3}>HSN</Text>
          <Text style={styles.col4}>Qty</Text>
          <Text style={styles.col5}>Unit (₹)</Text>
          <Text style={styles.col6}>Taxable (₹)</Text>
          <Text style={styles.col7}>Amount (₹)</Text>
        </View>
        {props.items.map((it) => (
          <View key={it.idx} style={styles.row} wrap={false}>
            <Text style={styles.col1}>{it.idx}</Text>
            <Text style={styles.col2}>{it.description}</Text>
            <Text style={styles.col3}>{it.hsn}</Text>
            <Text style={styles.col4}>{it.qty}</Text>
            <Text style={styles.col5}>{it.unitPrice.toFixed(2)}</Text>
            <Text style={styles.col6}>{it.amount.toFixed(2)}</Text>
            <Text style={styles.col7}>{it.amount.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Taxable value</Text>
            <Text>₹{props.taxableSubtotal.toFixed(2)}</Text>
          </View>
          {props.isInterState ? (
            <View style={styles.totalRow}>
              <Text>IGST (18%)</Text>
              <Text>₹{props.igst.toFixed(2)}</Text>
            </View>
          ) : (
            <>
              <View style={styles.totalRow}>
                <Text>CGST (9%)</Text>
                <Text>₹{props.cgst.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>SGST (9%)</Text>
                <Text>₹{props.sgst.toFixed(2)}</Text>
              </View>
            </>
          )}
          <View style={[styles.totalRow, { fontFamily: "Helvetica-Bold", borderTopWidth: 1, borderTopColor: "#94a3b8" }]}>
            <Text>Grand total</Text>
            <Text>₹{props.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.words}>Amount in words: {words}</Text>

        <View style={styles.footer}>
          <Text>This is a computer-generated invoice.</Text>
          <Text>For {props.company.name}</Text>
          <Text style={{ marginTop: 6 }}>Authorised signatory ___________________________</Text>
          <Text style={{ marginTop: 4 }}>{props.jurisdictionNote}</Text>
        </View>
      </Page>
    </Document>
  );
}

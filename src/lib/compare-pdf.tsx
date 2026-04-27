import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import * as React from "react";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  h1: { fontSize: 16, marginBottom: 12 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 6 },
  cell: { flex: 1, paddingRight: 8 },
  label: { fontWeight: "bold", width: 90 },
});

export type ComparePdfRow = {
  name: string;
  brand: string;
  minPrice: number;
  specs: Record<string, unknown>;
};

export function ComparePdfDocument({ rows }: { rows: ComparePdfRow[] }) {
  const keys = ["cpu", "chip", "Processor", "ram", "RAM", "storage", "Storage", "display", "Display"];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Rentfoxxy — Product comparison</Text>
        <Text style={{ marginBottom: 8, color: "#64748b" }}>{rows.length} products</Text>
        {rows.map((r) => (
          <View key={r.name} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>{r.name}</Text>
            <Text style={{ color: "#475569" }}>{r.brand}</Text>
            <Text>From ₹{r.minPrice.toLocaleString("en-IN")} / unit (ex-GST)</Text>
            {keys.map((k) => {
              const v = r.specs[k] ?? r.specs[k.toLowerCase()];
              if (v == null || String(v).length === 0) return null;
              return (
                <View key={k} style={styles.row}>
                  <Text style={styles.label}>{k}</Text>
                  <Text style={styles.cell}>{String(v)}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}

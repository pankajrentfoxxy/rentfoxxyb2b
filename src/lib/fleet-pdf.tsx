import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import * as React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 18, marginBottom: 16 },
  row: { marginBottom: 6 },
  box: { marginTop: 16, padding: 12, backgroundColor: "#f1f5f9", borderRadius: 4 },
});

export function FleetReportDoc({
  fleetSize,
  avgAge,
  targetLife,
  avgNewPrice,
  avgRefurbPrice,
  renewTotal,
  savings,
}: {
  fleetSize: number;
  avgAge: number;
  targetLife: number;
  avgNewPrice: number;
  avgRefurbPrice: number;
  renewTotal: number;
  savings: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Fleet renewal estimate</Text>
        <Text style={styles.row}>Fleet size: {fleetSize} units</Text>
        <Text style={styles.row}>Average age: {avgAge} years</Text>
        <Text style={styles.row}>Target life (years): {targetLife}</Text>
        <Text style={styles.row}>Assumed new unit price: ₹{avgNewPrice.toLocaleString("en-IN")}</Text>
        <Text style={styles.row}>Assumed refurb unit price: ₹{avgRefurbPrice.toLocaleString("en-IN")}</Text>
        <View style={styles.box}>
          <Text style={{ fontWeight: "bold" }}>Full refresh (new): ₹{renewTotal.toLocaleString("en-IN")}</Text>
          <Text style={{ marginTop: 8 }}>
            Estimated savings vs new if sourcing verified refurb: ₹{savings.toLocaleString("en-IN")}
          </Text>
        </View>
        <Text style={{ marginTop: 24, fontSize: 9, color: "#64748b" }}>
          Indicative numbers for planning — not a binding quote. Rentfoxxy — rentfoxxy.com
        </Text>
      </Page>
    </Document>
  );
}

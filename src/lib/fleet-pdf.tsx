import { FLEET_GRADE_CONFIG, type FleetGradeKey } from "@/constants/fleet-calculator";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import * as React from "react";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 40, backgroundColor: "#F8FAFC", fontSize: 10 },
  header: {
    backgroundColor: "#0A1628",
    padding: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  headerBrand: { color: "#FFFFFF", fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Helvetica-Bold" },
  headerSub: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 6 },
  savingsBox: { backgroundColor: "#F59E0B", padding: 16, borderRadius: 8, marginBottom: 20 },
  savingsLabel: { color: "#0A1628", fontSize: 9, fontFamily: "Helvetica-Bold" },
  savingsAmt: { color: "#0A1628", fontSize: 26, fontFamily: "Helvetica-Bold", marginTop: 4 },
  savingsSub: { color: "#0A1628", fontSize: 10, marginTop: 4, opacity: 0.85 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0A1628", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  label: { color: "#64748B", fontSize: 9 },
  value: { color: "#0A1628", fontSize: 9, fontFamily: "Helvetica-Bold" },
  bullet: { color: "#475569", fontSize: 9, marginBottom: 4, paddingLeft: 8 },
  footer: { marginTop: 20, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#E2E8F0" },
  footerText: { color: "#94A3B8", fontSize: 8, textAlign: "center" },
});

function isGradeKey(g: string): g is FleetGradeKey {
  return g in FLEET_GRADE_CONFIG;
}

export function FleetReportDoc({
  fleetSize,
  avgAge,
  targetLife,
  avgNewPrice,
  avgRefurbPrice,
  renewTotal,
  refurbTotal,
  savings,
  savingsPct,
  grade,
}: {
  fleetSize: number;
  avgAge: number;
  targetLife: number;
  avgNewPrice: number;
  avgRefurbPrice: number;
  renewTotal: number;
  refurbTotal: number;
  savings: number;
  savingsPct: number;
  grade: string;
}) {
  const g = isGradeKey(grade) ? FLEET_GRADE_CONFIG[grade] : null;
  const savePerUnit = avgNewPrice - avgRefurbPrice;
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>rentfoxxy</Text>
          <Text style={styles.headerTitle}>Fleet Renewal Analysis Report</Text>
          <Text style={styles.headerSub}>Generated {dateStr} · Indicative planning figures</Text>
        </View>

        <View style={styles.savingsBox}>
          <Text style={styles.savingsLabel}>ESTIMATED SAVINGS VS ALL-NEW</Text>
          <Text style={styles.savingsAmt}>₹{Math.round(savings).toLocaleString("en-IN")}</Text>
          <Text style={styles.savingsSub}>
            {savingsPct}% lower total cost · {fleetSize.toLocaleString("en-IN")} units · {grade}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fleet size</Text>
            <Text style={styles.value}>{fleetSize} units</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Average fleet age</Text>
            <Text style={styles.value}>{avgAge} years</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Refurb grade</Text>
            <Text style={styles.value}>{grade}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>New laptop (assumed / unit, ex-GST)</Text>
            <Text style={styles.value}>₹{avgNewPrice.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Refurb laptop (assumed / unit, ex-GST)</Text>
            <Text style={styles.value}>₹{avgRefurbPrice.toLocaleString("en-IN")}</Text>
          </View>
          {targetLife > 0 ? (
            <View style={styles.row}>
              <Text style={styles.label}>Target useful life (reference)</Text>
              <Text style={styles.value}>{targetLife} years</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>All-new total</Text>
            <Text style={styles.value}>₹{renewTotal.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Verified refurb total</Text>
            <Text style={styles.value}>₹{refurbTotal.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated savings</Text>
            <Text style={styles.value}>₹{savings.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Savings vs new</Text>
            <Text style={styles.value}>{savingsPct}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per-unit comparison</Text>
          <View style={styles.row}>
            <Text style={styles.label}>New / unit</Text>
            <Text style={styles.value}>₹{avgNewPrice.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Refurb / unit</Text>
            <Text style={styles.value}>₹{avgRefurbPrice.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Save / unit</Text>
            <Text style={styles.value}>₹{Math.round(savePerUnit).toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {g ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grade information</Text>
            <Text style={[styles.label, { marginBottom: 6, color: "#0A1628", fontFamily: "Helvetica-Bold" }]}>
              {grade}
            </Text>
            <Text style={[styles.label, { marginBottom: 8, lineHeight: 1.4 }]}>{g.desc}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Warranty</Text>
              <Text style={styles.value}>{g.warranty}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Cosmetic standard</Text>
              <Text style={styles.value}>{g.cosmetic}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps on Rentfoxxy</Text>
          <Text style={styles.bullet}>• Browse verified refurb lots matching your grade and fleet size.</Text>
          <Text style={styles.bullet}>• Request a lot sale or custom quote for orders above 20 units.</Text>
          <Text style={styles.bullet}>• Use inspection-certified inventory for GST-compliant procurement.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Rentfoxxy — https://rentfoxxy.com — Not a binding quote. GST and duties excluded unless
            stated.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

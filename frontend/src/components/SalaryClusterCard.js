import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { radius, typography } from "../theme";

export default function SalaryClusterCard({ cluster, index = 0, isDarkMode = false }) {
  const [expanded, setExpanded] = useState(false);

  // Distinct color palettes for clusters
  const themeColors = [
    {
      primary: "#2563eb",
      light: "#eff6ff",
      border: "#bfdbfe",
      bar: "#3b82f6"
    },
    {
      primary: "#7c3aed",
      light: "#f5f3ff",
      border: "#ddd6fe",
      bar: "#8b5cf6"
    },
    {
      primary: "#059669",
      light: "#ecfdf5",
      border: "#a7f3d0",
      bar: "#10b981"
    },
    {
      primary: "#d97706",
      light: "#fffbeb",
      border: "#fde68a",
      bar: "#f59e0b"
    }
  ];

  const theme = themeColors[index % themeColors.length];

  const formatThb = (val) =>
    Number(val).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

  return (
    <View style={[styles.card, { borderColor: isDarkMode ? "#334155" : theme.border }, isDarkMode && { backgroundColor: "#111827" }]}>
      {/* Header with Cluster Badge & Percentage */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: isDarkMode ? "#1e293b" : theme.light, borderColor: isDarkMode ? "#3b82f6" : theme.border }]}>
          <Text style={[styles.badgeText, { color: isDarkMode ? "#60a5fa" : theme.primary }]}>
            {cluster.group ? `${cluster.group} (${cluster.label || ""})` : (cluster.label || `Tier ${index + 1}`)}
          </Text>
        </View>
        <Text style={[styles.countText, { color: isDarkMode ? "#93c5fd" : theme.primary }]}>
          {cluster.count} {cluster.count === 1 ? "Employee" : "Employees"} {cluster.percentage ? `(${cluster.percentage}%)` : ""}
        </Text>
      </View>

      {/* Centroid / Average Salary */}
      <View style={styles.centroidSection}>
        <Text style={[styles.centroidLabel, isDarkMode && { color: "#94a3b8" }]}>Cluster Centroid (Average Salary)</Text>
        <Text style={[styles.centroidAmount, { color: isDarkMode ? "#60a5fa" : theme.primary }]}>
          ฿{formatThb(cluster.centroid || cluster.averageSalary)}
        </Text>
      </View>

      {/* Salary Range & Total Expenditure */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, isDarkMode && { backgroundColor: "#1a2234", borderColor: "#334155" }]}>
          <Text style={[styles.statLabel, isDarkMode && { color: "#94a3b8" }]}>Salary Range</Text>
          <Text style={[styles.statValue, isDarkMode && { color: "#f8fafc" }]}>
            ฿{formatThb(cluster.minSalary)} - ฿{formatThb(cluster.maxSalary)}
          </Text>
        </View>
        <View style={[styles.statBox, isDarkMode && { backgroundColor: "#1a2234", borderColor: "#334155" }]}>
          <Text style={[styles.statLabel, isDarkMode && { color: "#94a3b8" }]}>Total Cluster Payroll</Text>
          <Text style={[styles.statValue, isDarkMode && { color: "#f8fafc" }]}>฿{formatThb(cluster.totalSalary)}</Text>
        </View>
      </View>

      {/* Percentage Bar */}
      <View style={[styles.progressBarTrack, isDarkMode && { backgroundColor: "#1e293b" }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(Math.max(cluster.percentage, 5), 100)}%`,
              backgroundColor: theme.bar
            }
          ]}
        />
      </View>

      {/* Toggle Employees List Button */}
      {cluster.employees && cluster.employees.length > 0 && (
        <TouchableOpacity
          style={[styles.expandBtn, isDarkMode && { borderTopColor: "#334155" }]}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.expandBtnText, { color: isDarkMode ? "#60a5fa" : theme.primary }]}>
            {expanded ? "Hide Employees ▲" : `View ${cluster.employees.length} Employees ▼`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Expanded Employee List */}
      {expanded && cluster.employees && (
        <View style={[styles.employeeList, isDarkMode && { backgroundColor: "#1a2234", borderColor: "#334155" }]}>
          {cluster.employees.map((emp) => (
            <View key={emp.id} style={[styles.employeeItem, isDarkMode && { borderBottomColor: "#334155" }]}>
              <View style={styles.employeeInfo}>
                <Text style={[styles.empName, isDarkMode && { color: "#f8fafc" }]}>{emp.name}</Text>
                <Text style={[styles.empPos, isDarkMode && { color: "#94a3b8" }]}>{emp.position}</Text>
              </View>
              <View style={styles.employeeMeta}>
                <Text style={[styles.empSalary, isDarkMode && { color: "#f8fafc" }]}>฿{formatThb(emp.salary)}</Text>
                <View
                  style={[
                    styles.miniStatusBadge,
                    emp.status === "Active" ? styles.miniActive : styles.miniLeave
                  ]}
                >
                  <Text
                    style={[
                      styles.miniStatusText,
                      emp.status === "Active" ? styles.textActive : styles.textLeave
                    ]}
                  >
                    {emp.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.none,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMono
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: typography.fontFamilyMono
  },
  centroidSection: {
    marginBottom: 14
  },
  centroidLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: typography.fontFamily
  },
  centroidAmount: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: typography.fontFamilyMono
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 2,
    fontWeight: "600",
    textTransform: "uppercase",
    fontFamily: typography.fontFamily
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: typography.fontFamilyMono
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: radius.none,
    overflow: "hidden",
    marginBottom: 12
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radius.none
  },
  expandBtn: {
    paddingVertical: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9"
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  employeeList: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10
  },
  employeeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7"
  },
  employeeInfo: {
    flex: 1
  },
  empName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: typography.fontFamily
  },
  empPos: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: typography.fontFamily
  },
  employeeMeta: {
    alignItems: "flex-end"
  },
  empSalary: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
    fontFamily: typography.fontFamilyMono
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.none
  },
  miniActive: {
    backgroundColor: "#ecfdf5"
  },
  miniLeave: {
    backgroundColor: "#fffbeb"
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: typography.fontFamilyMono
  },
  textActive: {
    color: "#059669"
  },
  textLeave: {
    color: "#d97706"
  }
});

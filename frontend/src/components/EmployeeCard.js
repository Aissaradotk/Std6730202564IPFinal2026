import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { radius, typography } from "../theme";

export default function EmployeeCard({
  employee,
  onToggleStatus,
  onDelete,
  isToggling = false,
  isDeleting = false,
  isDarkMode = false
}) {
  const { id, name, position, status, salary } = employee;
  const isActive = status === "Active";

  // Formatter for Thai Baht / currency
  const formattedSalary = Number(salary).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // Get initials for avatar badge
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EP";

  return (
    <View style={[styles.card, isDarkMode && { backgroundColor: "#111827", borderColor: "#334155" }]}>
      <View style={styles.headerRow}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, isActive ? styles.avatarActive : styles.avatarLeave]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.nameText, isDarkMode && { color: "#f8fafc" }]}>{name}</Text>
            <Text style={[styles.positionText, isDarkMode && { color: "#94a3b8" }]}>{position}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeLeave]}>
          <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotLeave]} />
          <Text style={[styles.statusText, isActive ? styles.textActive : styles.textLeave]}>
            {status}
          </Text>
        </View>
      </View>

      {/* Salary & Details Row */}
      <View style={[styles.salarySection, isDarkMode && { backgroundColor: "#1a2234", borderColor: "#334155" }]}>
        <Text style={[styles.salaryLabel, isDarkMode && { color: "#94a3b8" }]}>Monthly Salary</Text>
        <Text style={[styles.salaryAmount, isDarkMode && { color: "#f8fafc" }]}>
          ฿{formattedSalary}
          <Text style={styles.salaryPeriod}> / month</Text>
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.toggleBtn, isActive ? styles.toggleBtnLeave : styles.toggleBtnActive]}
          onPress={() => onToggleStatus(id)}
          disabled={isToggling || isDeleting}
          activeOpacity={0.7}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.toggleBtnText}>
              {isActive ? "Set On Leave" : "Set Active"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn, isDarkMode && { backgroundColor: "#451a1a", borderColor: "#7f1d1d" }]}
          onPress={() => onDelete(id, name)}
          disabled={isToggling || isDeleting}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text style={[styles.deleteBtnText, isDarkMode && { color: "#f87171" }]}>Delete</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)"
  },
  avatarActive: {
    backgroundColor: "#2563eb"
  },
  avatarLeave: {
    backgroundColor: "#64748b"
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
    fontFamily: typography.fontFamilyMono
  },
  nameContainer: {
    flex: 1
  },
  nameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
    fontFamily: typography.fontFamily
  },
  positionText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    fontFamily: typography.fontFamily
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.none
  },
  badgeActive: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0"
  },
  badgeLeave: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a"
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.none,
    marginRight: 6
  },
  dotActive: {
    backgroundColor: "#10b981"
  },
  dotLeave: {
    backgroundColor: "#f59e0b"
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: typography.fontFamilyMono
  },
  textActive: {
    color: "#059669"
  },
  textLeave: {
    color: "#d97706"
  },
  salarySection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14
  },
  salaryLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 2,
    fontFamily: typography.fontFamily
  },
  salaryAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: typography.fontFamilyMono
  },
  salaryPeriod: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
    fontFamily: typography.fontFamily
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: radius.xs,
    justifyContent: "center",
    alignItems: "center"
  },
  toggleBtn: {
    flex: 2,
    borderWidth: 1
  },
  toggleBtnActive: {
    backgroundColor: "#10b981",
    borderColor: "#059669"
  },
  toggleBtnLeave: {
    backgroundColor: "#4f46e5",
    borderColor: "#4338ca"
  },
  toggleBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5"
  },
  deleteBtnText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  }
});

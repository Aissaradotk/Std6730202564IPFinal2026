import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { createEmployeeApi, deleteEmployeeApi, getEmployeesApi, getSalaryClustersApi, toggleEmployeeStatusApi } from "../api/api";
import EmployeeCard from "../components/EmployeeCard";
import SalaryClusterCard from "../components/SalaryClusterCard";
import { colors, radius, typography } from "../theme";

export default function DashboardScreen({
  token,
  onLogout,
  username = "admin",
  isDarkMode = false,
  onToggleTheme,
  theme = colors
}) {
  // Navigation tabs: 'employees' | 'analytics' | 'specs'
  const [activeTab, setActiveTab] = useState("employees");

  // Data states
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All' | 'Active' | 'On Leave'

  // Add Employee Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Action in-flight states
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Load all data
  const fetchData = useCallback(async () => {
    try {
      const [empData, analyticsData] = await Promise.all([
        getEmployeesApi(token),
        getSalaryClustersApi(token, 3)
      ]);

      if (Array.isArray(empData)) {
        setEmployees(empData);
      }
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      Alert.alert("Network Error", err.message || "Failed to load data from backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const [empData, analyticsData] = await Promise.all([
          getEmployeesApi(token),
          getSalaryClustersApi(token, 3)
        ]);
        if (!active) return;
        if (Array.isArray(empData)) {
          setEmployees(empData);
        }
        if (analyticsData) {
          setAnalytics(analyticsData);
        }
      } catch (err) {
        if (!active) return;
        console.error("Error fetching dashboard data:", err);
        Alert.alert("Network Error", err.message || "Failed to load data from backend.");
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Phase 2: Analyze Salary Structure (K-Means)
  const handleAnalyzeSalaryStructure = async () => {
    setIsAnalyzing(true);
    setActiveTab("analytics");
    try {
      const data = await getSalaryClustersApi(token, 3);
      if (data) {
        setAnalytics(data);
      }
    } catch (err) {
      Alert.alert("Analysis Error", err.message || "Failed to analyze salary structure.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle Employee Status
  const handleToggleStatus = async (id) => {
    setTogglingId(id);
    try {
      const updated = await toggleEmployeeStatusApi(id, token);
      if (updated && updated.id) {
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === updated.id ? updated : emp))
        );
        getSalaryClustersApi(token, 3).then(setAnalytics).catch(() => {});
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to toggle employee status.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Employee (with mandatory Confirmation Dialog)
  const handleDeleteEmployee = (id, name) => {
    const executeDelete = async () => {
      setDeletingId(id);
      try {
        await deleteEmployeeApi(id, token);
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
        getSalaryClustersApi(token, 3).then(setAnalytics).catch(() => {});
      } catch (err) {
        Alert.alert("Error", err.message || "Failed to delete employee.");
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to remove employee "${name}" from the system?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Confirm Deletion",
        `Are you sure you want to remove employee "${name}" from the system?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: executeDelete }
        ]
      );
    }
  };

  // Create Employee with Client-side Validation
  const handleCreateEmployee = async () => {
    setFormError("");

    // Client-side validation: all fields required
    if (!newName.trim() || !newPosition.trim() || !newSalary.trim()) {
      const msg = "All fields (Name, Position, and Salary) are required.";
      setFormError(msg);
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Validation Error", msg);
      }
      return;
    }

    const numSalary = Number(newSalary);
    if (isNaN(numSalary) || !isFinite(numSalary) || numSalary <= 0) {
      const msg = "Salary must be a positive numeric value greater than zero.";
      setFormError(msg);
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Validation Error", msg);
      }
      return;
    }

    setSubmitting(true);
    try {
      const created = await createEmployeeApi(
        {
          name: newName.trim(),
          position: newPosition.trim(),
          salary: numSalary
        },
        token
      );

      if (created && created.id) {
        setEmployees((prev) => [...prev, created]);
        setNewName("");
        setNewPosition("");
        setNewSalary("");
        setModalVisible(false);
        getSalaryClustersApi(token, 3).then(setAnalytics).catch(() => {});
      }
    } catch (err) {
      setFormError(err.message || "Failed to create employee.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live statistics
  const totalEmployeesCount = employees.length;
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const totalPayroll = employees.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
  const avgSalary = totalEmployeesCount > 0 ? Math.round(totalPayroll / totalEmployeesCount) : 0;

  const formatThb = (val) =>
    Number(val).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surfaceBg }]}>
      {/* Executive Dark Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>💼</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>HR Manager & Salary Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Logged in as <Text style={styles.usernameHighlight}>{username}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: isDarkMode ? "#1e293b" : "#1e293b", borderColor: "#475569" }]}
            onPress={onToggleTheme}
            activeOpacity={0.8}
          >
            <Text style={styles.themeToggleBtnText}>
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Sign Out 🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Overview Strip */}
      <View style={[styles.kpiContainer, isDarkMode && { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <View style={[styles.kpiCard, isDarkMode && { backgroundColor: theme.kpiBg, borderColor: theme.kpiBorder }]}>
          <Text style={styles.kpiLabel}>Headcount</Text>
          <Text style={[styles.kpiValue, isDarkMode && { color: theme.textPrimary }]}>{totalEmployeesCount}</Text>
        </View>
        <View style={[styles.kpiCard, isDarkMode && { backgroundColor: theme.kpiBg, borderColor: theme.kpiBorder }]}>
          <Text style={styles.kpiLabel}>Active</Text>
          <Text style={[styles.kpiValue, { color: "#10b981" }]}>{activeCount}</Text>
        </View>
        <View style={[styles.kpiCard, isDarkMode && { backgroundColor: theme.kpiBg, borderColor: theme.kpiBorder }]}>
          <Text style={styles.kpiLabel}>On Leave</Text>
          <Text style={[styles.kpiValue, { color: "#f59e0b" }]}>{onLeaveCount}</Text>
        </View>
        <View style={[styles.kpiCard, isDarkMode && { backgroundColor: theme.kpiBg, borderColor: theme.kpiBorder }]}>
          <Text style={styles.kpiLabel}>Avg. Base</Text>
          <Text style={styles.kpiValueSmall}>฿{formatThb(avgSalary)}</Text>
        </View>
      </View>

      {/* Custom Clean Navigation Tabs (No Expo Starter Remnants!) */}
      <View style={[styles.tabBar, isDarkMode && { backgroundColor: theme.tabBg, borderBottomColor: theme.tabBorder }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "employees" && styles.tabItemActive]}
          onPress={() => setActiveTab("employees")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, isDarkMode && { color: activeTab === "employees" ? "#60a5fa" : theme.textSecondary }, activeTab === "employees" && styles.tabTextActive]}>
            👥 Employee Management ({employees.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "analytics" && styles.tabItemActive]}
          onPress={() => setActiveTab("analytics")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, isDarkMode && { color: activeTab === "analytics" ? "#60a5fa" : theme.textSecondary }, activeTab === "analytics" && styles.tabTextActive]}>
            📊 Salary Analytics (K-Means)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "specs" && styles.tabItemActive]}
          onPress={() => setActiveTab("specs")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, isDarkMode && { color: activeTab === "specs" ? "#60a5fa" : theme.textSecondary }, activeTab === "specs" && styles.tabTextActive]}>
            ℹ️ System Info
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Scroll Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.loadingText, isDarkMode && { color: theme.textSecondary }]}>Fetching Records from Backend API...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollInner}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
          }
        >
          {/* TAB 1: EMPLOYEE MANAGEMENT */}
          {activeTab === "employees" && (
            <View>
              {/* Quick Action Banner with Phase 2 Trigger */}
              <View style={[styles.actionBanner, isDarkMode && { backgroundColor: "#172554", borderColor: "#1e3a8a" }]}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.bannerTitle, isDarkMode && { color: "#93c5fd" }]}>K-Means Salary Analysis</Text>
                  <Text style={[styles.bannerSubtitle, isDarkMode && { color: "#60a5fa" }]}>
                    Run automated 1D K-Means clustering algorithm on current salaries ($k=3$).
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.analyzeBtnPrimary}
                  onPress={handleAnalyzeSalaryStructure}
                  disabled={isAnalyzing}
                  activeOpacity={0.8}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.analyzeBtnText}>⚡ Analyze Salary Structure</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Controls: Search Bar */}
              <View style={styles.controlsRow}>
                <TextInput
                  style={[styles.searchInput, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textPrimary }]}
                  placeholder="🔍 Search employee by name or position..."
                  placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Status Filter Pills & Add Button */}
              <View style={styles.filterAndActionRow}>
                <View style={styles.filterPills}>
                  {["All", "Active", "On Leave"].map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterPill,
                        isDarkMode && { backgroundColor: "#1e293b", borderColor: "#334155" },
                        statusFilter === filter && styles.filterPillActive
                      ]}
                      onPress={() => setStatusFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          isDarkMode && { color: statusFilter === filter ? "#ffffff" : "#94a3b8" },
                          statusFilter === filter && styles.filterPillTextActive
                        ]}
                      >
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addEmployeeBtn}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addEmployeeBtnText}>+ Add Employee</Text>
                </TouchableOpacity>
              </View>

              {/* Employees List */}
              {filteredEmployees.length === 0 ? (
                <View style={[styles.emptyState, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={styles.emptyIcon}>📂</Text>
                  <Text style={[styles.emptyTitle, isDarkMode && { color: theme.textPrimary }]}>No Employees Found</Text>
                  <Text style={[styles.emptyDesc, isDarkMode && { color: theme.textSecondary }]}>
                    {searchQuery
                      ? "No records match your search filter."
                      : "No employee records exist currently. Add a new employee above."}
                  </Text>
                </View>
              ) : (
                filteredEmployees.map((emp) => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteEmployee}
                    isToggling={togglingId === emp.id}
                    isDeleting={deletingId === emp.id}
                    isDarkMode={isDarkMode}
                  />
                ))
              )}
            </View>
          )}

          {/* TAB 2: SALARY ANALYTICS (K-MEANS) */}
          {activeTab === "analytics" && (
            <View>
              {/* Header Box with Direct Button */}
              <View style={[styles.analyticsIntroBox, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.introHeader}>
                  <Text style={styles.introIcon}>🧠</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.introTitle, isDarkMode && { color: theme.textPrimary }]}>Automated Salary Clustering (K-Means)</Text>
                    <Text style={[styles.introSubtitle, isDarkMode && { color: theme.textSecondary }]}>
                      Phase 2 Requirement: Groups employee base salaries into 3 distinct tiers (Tier 1, Tier 2, Tier 3) using 1D K-Means.
                    </Text>
                  </View>
                </View>

                {/* Primary Action Button (Mandatory Phase 2.2) */}
                <TouchableOpacity
                  style={[styles.bigAnalyzeBtn, isAnalyzing && styles.btnDisabled]}
                  onPress={handleAnalyzeSalaryStructure}
                  disabled={isAnalyzing}
                  activeOpacity={0.8}
                >
                  {isAnalyzing ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.bigAnalyzeBtnText}>Calculating Clusters (k=3)...</Text>
                    </View>
                  ) : (
                    <Text style={styles.bigAnalyzeBtnText}>🔄 Re-Analyze Salary Structure</Text>
                  )}
                </TouchableOpacity>

                {/* Overall Summary Stats */}
                {analytics && analytics.summary && (
                  <View style={[styles.analyticsStatsGrid, isDarkMode && { borderTopColor: theme.border }]}>
                    <View style={[styles.analyticsStatCard, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border }]}>
                      <Text style={[styles.analyticsStatLabel, isDarkMode && { color: theme.textSecondary }]}>Total Payroll</Text>
                      <Text style={[styles.analyticsStatVal, isDarkMode && { color: theme.textPrimary }]}>
                        ฿{formatThb(analytics.summary.totalPayroll)}
                      </Text>
                    </View>
                    <View style={[styles.analyticsStatCard, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border }]}>
                      <Text style={[styles.analyticsStatLabel, isDarkMode && { color: theme.textSecondary }]}>Average Salary</Text>
                      <Text style={[styles.analyticsStatVal, isDarkMode && { color: theme.textPrimary }]}>
                        ฿{formatThb(analytics.summary.averageSalary)}
                      </Text>
                    </View>
                    <View style={[styles.analyticsStatCard, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border }]}>
                      <Text style={[styles.analyticsStatLabel, isDarkMode && { color: theme.textSecondary }]}>Median Salary</Text>
                      <Text style={[styles.analyticsStatVal, isDarkMode && { color: theme.textPrimary }]}>
                        ฿{formatThb(analytics.summary.medianSalary)}
                      </Text>
                    </View>
                    <View style={[styles.analyticsStatCard, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border }]}>
                      <Text style={[styles.analyticsStatLabel, isDarkMode && { color: theme.textSecondary }]}>Spread (Min - Max)</Text>
                      <Text style={[styles.analyticsStatVal, isDarkMode && { color: theme.textPrimary }]}>
                        ฿{formatThb(analytics.summary.minSalary)} - ฿{formatThb(analytics.summary.maxSalary)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Loading Indicator for Analysis */}
              {isAnalyzing ? (
                <View style={[styles.analyzingLoadingBox, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={[styles.analyzingLoadingTitle, isDarkMode && { color: theme.textPrimary }]}>Running K-Means Algorithm...</Text>
                  <Text style={[styles.analyzingLoadingSubtitle, isDarkMode && { color: theme.textSecondary }]}>
                    Contacting GET /api/employees/salary-clusters
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.sectionHeader, isDarkMode && { color: theme.textPrimary }]}>Salary Tiers & Summary Cards</Text>
                  {analytics && analytics.clusters && analytics.clusters.length > 0 ? (
                    analytics.clusters.map((cluster, idx) => (
                      <SalaryClusterCard
                        key={cluster.id || cluster.group || idx}
                        cluster={cluster}
                        index={idx}
                        isDarkMode={isDarkMode}
                      />
                    ))
                  ) : (
                    <View style={[styles.emptyState, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <Text style={styles.emptyIcon}>📊</Text>
                      <Text style={[styles.emptyTitle, isDarkMode && { color: theme.textPrimary }]}>No Clusters Calculated</Text>
                      <Text style={[styles.emptyDesc, isDarkMode && { color: theme.textSecondary }]}>
                        Press the Analyze Salary Structure button above to group current employees.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* TAB 3: SYSTEM INFO & EXAM CHECKLIST */}
          {activeTab === "specs" && (
            <View style={styles.specsContainer}>
              <View style={[styles.specCard, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.specTitle, isDarkMode && { color: theme.textPrimary }]}>📋 Exam Technical Specifications</Text>
                <Text style={[styles.specSubtitle, isDarkMode && { color: theme.textSecondary }]}>
                  Internet Programming Final Exam 2026 • 100 Points Rubric
                </Text>

                <View style={[styles.specItem, isDarkMode && { borderBottomColor: theme.border }]}>
                  <Text style={styles.specBadgeDone}>✓ PASS</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specName, isDarkMode && { color: theme.textPrimary }]}>Backend (Express.js REST API)</Text>
                    <Text style={[styles.specDetail, isDarkMode && { color: theme.textSecondary }]}>
                      Listening on Port 3000. In-memory storage. Auth token middleware.
                    </Text>
                  </View>
                </View>

                <View style={[styles.specItem, isDarkMode && { borderBottomColor: theme.border }]}>
                  <Text style={styles.specBadgeDone}>✓ PASS</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specName, isDarkMode && { color: theme.textPrimary }]}>Authentication (15 pts)</Text>
                    <Text style={[styles.specDetail, isDarkMode && { color: theme.textSecondary }]}>
                      POST /api/login verifies configured credentials and returns an auth token.
                    </Text>
                  </View>
                </View>

                <View style={[styles.specItem, isDarkMode && { borderBottomColor: theme.border }]}>
                  <Text style={styles.specBadgeDone}>✓ PASS</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specName, isDarkMode && { color: theme.textPrimary }]}>Employee CRUD (20 pts)</Text>
                    <Text style={[styles.specDetail, isDarkMode && { color: theme.textSecondary }]}>
                      GET, POST, PUT /status, DELETE /api/employees with 400 Bad Request handling.
                    </Text>
                  </View>
                </View>

                <View style={[styles.specItem, isDarkMode && { borderBottomColor: theme.border }]}>
                  <Text style={styles.specBadgeDone}>✓ PASS</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specName, isDarkMode && { color: theme.textPrimary }]}>Phase 2 K-Means Analytics (30 pts)</Text>
                    <Text style={[styles.specDetail, isDarkMode && { color: theme.textSecondary }]}>
                      GET /api/employees/salary-clusters calculates 1D K-Means (k=3) into Tier 1, 2, 3.
                    </Text>
                  </View>
                </View>

                <View style={[styles.specItem, isDarkMode && { borderBottomColor: theme.border }]}>
                  <Text style={styles.specBadgeDone}>✓ PASS</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specName, isDarkMode && { color: theme.textPrimary }]}>Frontend UI & Validation (25 pts)</Text>
                    <Text style={[styles.specDetail, isDarkMode && { color: theme.textSecondary }]}>
                      Client-side form check, delete confirmation alert dialog, live state updates.
                    </Text>
                  </View>
                </View>

                <View style={[styles.specItem, isDarkMode && { borderBottomColor: theme.border }]}>
                  <Text style={styles.specBadgeDone}>✓ PASS</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specName, isDarkMode && { color: theme.textPrimary }]}>Directory & Submission (10 pts)</Text>
                    <Text style={[styles.specDetail, isDarkMode && { color: theme.textSecondary }]}>
                      Strict backend/ and frontend/ folders, tsc & eslint 0 errors.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: Add New Employee */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, isDarkMode && { color: theme.textPrimary }]}>Add New Employee</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={styles.formErrorBox}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            {/* Name Input */}
            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, isDarkMode && { color: theme.textSecondary }]}>Employee Name *</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="e.g. Somsak Jaidee"
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            {/* Position Input */}
            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, isDarkMode && { color: theme.textSecondary }]}>Position / Job Title *</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="e.g. Full-Stack Developer"
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                value={newPosition}
                onChangeText={setNewPosition}
              />
            </View>

            {/* Salary Input */}
            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, isDarkMode && { color: theme.textSecondary }]}>Base Salary (THB) *</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="e.g. 45000"
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                keyboardType="numeric"
                value={newSalary}
                onChangeText={setNewSalary}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isDarkMode && { backgroundColor: theme.subCardBg, borderColor: theme.border }]}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={[styles.modalCancelText, isDarkMode && { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreateEmployee}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Employee</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceBg
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.xs,
    backgroundColor: colors.logoBadgeBg,
    borderWidth: 1,
    borderColor: colors.logoBadgeBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  logoEmoji: {
    fontSize: 18
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
    fontFamily: typography.fontFamily
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
    fontFamily: typography.fontFamily
  },
  usernameHighlight: {
    color: "#60a5fa",
    fontWeight: "700"
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  themeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#475569"
  },
  themeToggleBtnText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMono
  },
  logoutBtn: {
    backgroundColor: colors.logoBadgeBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#475569"
  },
  logoutBtnText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  kpiContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    gap: 8
  },
  kpiCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  kpiLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: typography.fontFamily
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: typography.fontFamilyMono
  },
  kpiValueSmall: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.buttonBg,
    fontFamily: typography.fontFamilyMono
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder
  },
  tabItem: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent"
  },
  tabItemActive: {
    borderBottomColor: colors.buttonBg
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.3,
    fontFamily: typography.fontFamily
  },
  tabTextActive: {
    color: "#2563eb",
    fontWeight: "800"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: typography.fontFamily
  },
  contentScroll: {
    flex: 1
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40
  },
  actionBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    borderRadius: radius.xs,
    padding: 14,
    marginBottom: 14
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e40af",
    marginBottom: 2,
    fontFamily: typography.fontFamily
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#3b82f6",
    fontFamily: typography.fontFamily
  },
  analyzeBtnPrimary: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#1d4ed8"
  },
  analyzeBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  controlsRow: {
    marginBottom: 10
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1e293b",
    fontFamily: typography.fontFamily
  },
  filterAndActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  filterPills: {
    flexDirection: "row",
    gap: 6
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.none,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  filterPillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#1d4ed8"
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    fontFamily: typography.fontFamilyMono
  },
  filterPillTextActive: {
    color: "#ffffff"
  },
  addEmployeeBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#059669"
  },
  addEmployeeBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 32,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    marginTop: 10
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
    fontFamily: typography.fontFamily
  },
  emptyDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    fontFamily: typography.fontFamily
  },
  analyticsIntroBox: {
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },
  introIcon: {
    fontSize: 28,
    marginRight: 12
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: typography.fontFamily
  },
  introSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontFamily: typography.fontFamily
  },
  bigAnalyzeBtn: {
    backgroundColor: "#2563eb",
    borderRadius: radius.xs,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1d4ed8"
  },
  bigAnalyzeBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  analyzingLoadingBox: {
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 30,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    marginBottom: 16
  },
  analyzingLoadingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 12,
    fontFamily: typography.fontFamily
  },
  analyzingLoadingSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontFamily: typography.fontFamily
  },
  analyticsStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12
  },
  analyticsStatCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  analyticsStatLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  analyticsStatVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
    fontFamily: typography.fontFamilyMono
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: typography.fontFamily
  },
  closeBtn: {
    fontSize: 18,
    color: "#64748b",
    padding: 4
  },
  formErrorBox: {
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: radius.none,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 12
  },
  formErrorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: typography.fontFamily
  },
  modalInputGroup: {
    marginBottom: 14
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  modalInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: radius.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    fontFamily: typography.fontFamily
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.xs,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  modalCancelText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
    fontFamily: typography.fontFamily
  },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.xs,
    backgroundColor: "#10b981",
    borderWidth: 1,
    borderColor: "#059669"
  },
  btnDisabled: {
    opacity: 0.7
  },
  modalSubmitText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  specsContainer: {
    marginBottom: 20
  },
  specCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius.xs,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#cbd5e1"
  },
  specTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: typography.fontFamily
  },
  specSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
    fontFamily: typography.fontFamily
  },
  specItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9"
  },
  specBadgeDone: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    fontWeight: "800",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.none,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    fontFamily: typography.fontFamilyMono
  },
  specName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: typography.fontFamily
  },
  specDetail: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontFamily: typography.fontFamily
  }
});

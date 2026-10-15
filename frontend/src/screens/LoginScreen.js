import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { getBaseUrl, loginApi, setBaseUrl } from "../api/api";
import { colors, radius, typography } from "../theme";

export default function LoginScreen({
  onLoginSuccess,
  isDarkMode = false,
  onToggleTheme,
  theme = colors
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiUrl, setApiUrl] = useState(getBaseUrl());
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setLoading(true);
    // Apply any customized API base URL
    setBaseUrl(apiUrl);

    try {
      const response = await loginApi(username.trim(), password.trim());
      if (response && response.success && response.token) {
        onLoginSuccess(response.token, username.trim());
      } else {
        setErrorMessage(response.message || "Invalid credentials.");
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to connect to backend server. Make sure server is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? "#070b14" : "#0f172a" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Theme Toggle */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: isDarkMode ? "#1e293b" : "rgba(30, 41, 59, 0.8)",
                  borderColor: isDarkMode ? "#475569" : "#334155"
                }
              ]}
              onPress={onToggleTheme}
              activeOpacity={0.7}
            >
              <Text style={styles.themeToggleText}>
                {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header Card / Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>📊</Text>
            </View>
            <Text style={styles.projectTitle}>HR Manager</Text>
            <Text style={styles.projectSubtitle}>& Salary Analytics System</Text>

          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.formTitle}>Administrator Sign In</Text>
            <Text style={styles.formDesc}>
              Enter credentials to access employee records and analytics.
            </Text>

            {/* Error Message Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In to Dashboard →</Text>
              )}
            </TouchableOpacity>



            {/* Advanced Connection Config (Optional for network test) */}
            <TouchableOpacity
              style={styles.configToggle}
              onPress={() => setShowConfig(!showConfig)}
            >
              <Text style={styles.configToggleText}>
                {showConfig ? "Hide Server Settings ▲" : "Server Connection Settings ⚙️"}
              </Text>
            </TouchableOpacity>

            {showConfig && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>Backend REST API URL:</Text>
                <TextInput
                  style={styles.configInput}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.configHint}>
                  Server: http://119.59.102.161:3000 (Live MySQL) or http://localhost:3000
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            HR Manager & Salary Analytics System
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center"
  },
  topBar: {
    alignItems: "flex-end",
    marginBottom: 16
  },
  themeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
    borderWidth: 1
  },
  themeToggleText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMono
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.xs,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(59, 130, 246, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14
  },
  iconEmoji: {
    fontSize: 28
  },
  projectTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: -0.5,
    fontFamily: typography.fontFamily
  },
  projectSubtitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#93c5fd",
    marginBottom: 10,
    fontFamily: typography.fontFamily
  },
  examBadge: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.none,
    borderWidth: 1,
    borderColor: "#334155"
  },
  examBadgeText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: typography.fontFamilyMono
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.xs,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    fontFamily: typography.fontFamily
  },
  formDesc: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
    fontFamily: typography.fontFamily
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: radius.none,
    padding: 12,
    marginBottom: 16
  },
  errorIcon: {
    marginRight: 8,
    fontSize: 16
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#b91c1c",
    fontWeight: "500",
    fontFamily: typography.fontFamily
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    fontFamily: typography.fontFamily
  },
  loginBtn: {
    backgroundColor: colors.buttonBg,
    borderRadius: radius.xs,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1d4ed8"
  },
  loginBtnDisabled: {
    opacity: 0.7
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: typography.fontFamily
  },
  configToggle: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 6
  },
  configToggleText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    fontFamily: typography.fontFamily
  },
  configBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  configLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
    textTransform: "uppercase",
    fontFamily: typography.fontFamily
  },
  configInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: radius.none,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#1e293b",
    fontFamily: typography.fontFamilyMono
  },
  configHint: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    fontFamily: typography.fontFamily
  },
  footerText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    marginTop: 24,
    fontFamily: typography.fontFamilyMono
  }
});

import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import IntroScreen from "./src/screens/IntroScreen";
import { getTheme } from "./src/theme";

export default function App() {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState("admin");
  const [showIntro, setShowIntro] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = getTheme(isDarkMode);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLoginSuccess = (receivedToken, username) => {
    setToken(receivedToken);
    if (username) {
      setCurrentUser(username);
    }
    setShowIntro(false);
  };

  const handleLogout = () => {
    setToken(null);
    setShowIntro(true);
  };

  if (showIntro && !token) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceBg }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {token ? (
        <DashboardScreen
          token={token}
          username={currentUser}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          theme={theme}
        />
      ) : (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          theme={theme}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

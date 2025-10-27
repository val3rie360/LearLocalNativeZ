import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Theme Wrapper Component
 * Applies theme background and status bar color
 */
export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark, theme } = useTheme();

  useEffect(() => {
    // Update status bar style based on theme
    StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
  }, [isDark]);

  return (
    <>
      <StatusBar 
        backgroundColor={theme.secondary} 
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      {children}
    </>
  );
};


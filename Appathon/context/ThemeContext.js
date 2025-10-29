import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

const lightTheme = {
  caramelBrown: "#c1a57d",
  accentGrey: "#f4f4f4",
  white: "#ffffff",
  textGrey: "#444444",
  background: "#ffffff",
  cardBackground: "#f4f4f4",
  text: "#444444",
  textSecondary: "#888888",
  primary: "#c1a57d",
  border: "#f4f4f4",
};

const darkTheme = {
  caramelBrown: "#c1a57d",
  accentGrey: "#2a2a2a",
  white: "#1a1a1a",
  textGrey: "#e0e0e0",
  background: "#1a1a1a",
  cardBackground: "#2a2a2a",
  text: "#e0e0e0",
  textSecondary: "#a0a0a0",
  primary: "#c1a57d",
  border: "#3a3a3a",
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

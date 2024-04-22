import { useState, useEffect } from "react";
import { SystemColorThemes } from "../types";

function useSystemColorThemeDetector() {
  const [systemColorScheme, setSystemColorScheme] = useState<SystemColorThemes>("light");

  useEffect(() => {
    // Function to detect system color scheme
    const detectSystemColorScheme = () => {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setSystemColorScheme("dark");
      } else {
        setSystemColorScheme("light");
      }
    };

    detectSystemColorScheme(); // Detect initial color scheme

    // Add event listener for changes in color scheme
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      detectSystemColorScheme();
    }
    mediaQueryList.addEventListener("change", handleChange);

    // Clean up event listener
    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, []);

  return systemColorScheme;
}

export default useSystemColorThemeDetector;

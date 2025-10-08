// src/theme.js
import { extendTheme } from "@chakra-ui/react";

// Config for color mode (light/dark)
const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Extend the default Chakra theme
const theme = extendTheme({ config });

export default theme;

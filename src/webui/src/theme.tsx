import { createTheme } from "@mui/material/styles";

// A custom theme for this app
const theme = createTheme({
  typography: {
    fontSize: 13,
  },
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    background: {
      default: "#F1F3F5",
    },
  },
});

export default theme;

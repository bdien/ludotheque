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
    success: {
      main: "#28a745",
    },
    secondary: {
      main: "#556cd6",
    },
    background: {
      default: "#F1F3F5",
    },
  },
});

export default theme;

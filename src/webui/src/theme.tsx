import { createTheme } from "@mui/material/styles";
import { frFR } from "@mui/x-data-grid";

// A custom theme for this app
const theme = createTheme(
  {
    palette: {
      primary: {
        main: "#556cd6",
      },
      secondary: {
        main: "#19857b",
      },
    },
  },
  frFR,
);

export default theme;

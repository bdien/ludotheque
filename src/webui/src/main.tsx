import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/fr";
import theme from "./theme";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Auth0Provider
        domain="dev-th8igg4x0hj35r1b.eu.auth0.com"
        clientId="wWKvUo1xxIozwbIrwSv4jB17xPsRTWD4"
        cacheLocation="localstorage"
        useRefreshTokens
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
          <App />
        </LocalizationProvider>
      </Auth0Provider>
    </ThemeProvider>
  </React.StrictMode>,
);

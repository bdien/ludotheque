import { Box, Button, Typography } from "@mui/material";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ height: "60vh", textAlign: "center", px: 2 }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Une erreur est survenue
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 500 }}>
            {this.state.error?.message || "Erreur inconnue"}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

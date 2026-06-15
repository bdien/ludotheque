import { Box, Button, Typography } from "@mui/material";
import { navigate } from "wouter/use-browser-location";

export function NotFound() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: "60vh", textAlign: "center", px: 2 }}
    >
      <Typography variant="h3" color="text.secondary" gutterBottom>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
        Page introuvable
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Accueil
      </Button>
    </Box>
  );
}

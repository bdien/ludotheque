import { Fade, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

export function Loading() {
  return (
    <Fade in={true} timeout={3000}>
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{ width: 1, height: "100vh" }}
      >
        <CircularProgress />
        <Typography variant="overline" sx={{ p: 2 }}>
          Chargement
        </Typography>
      </Stack>
    </Fade>
  );
}

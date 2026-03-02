import useMediaQuery from "@mui/material/useMediaQuery";
import { Box, Typography, useTheme } from "@mui/material";
import { ageColors } from "./age_chip";
import { ItemModel } from "../api/models";

export function ItemIdBox({ item }: { item: ItemModel }) {
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up("sm"));
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: ageColors(item.age)[0],
        border: "1.5px solid rgba(0,0,0,0.12)",
        borderRadius: "10px",
        px: 0.5,
        py: 0.5,
        mr: 0.5,
        minWidth: 36,
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: desktop ? "1.1rem" : "0.95rem",
          color: ageColors(item.age)[1],
          lineHeight: 1,
        }}
      >
        {item.id}
      </Typography>
    </Box>
  );
}

import Box from "@mui/material/Box";
import { useAuth0 } from "@auth0/auth0-react";
import { useStats } from "../api/hooks";
import Alert from "@mui/material/Alert";

export function MainAdmin() {
  const { stats } = useStats();

  if (!stats) return "Loading";

  const lastday = Object.keys(stats)[0];
  const laststats = stats[lastday];

  return (
    <>
      Jeux empruntés: {laststats.items.totalout}
      <br />
      Admin Page
    </>
  );
}

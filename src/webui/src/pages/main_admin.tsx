import { useStats } from "../api/hooks";

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

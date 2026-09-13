import { Alert, Icon } from "@mui/material";

// Soirées jeux : 1ers vendredis du mois, salle du Bocal, 20h30.
// Les dates passées sont masquées, seules les 3 prochaines sont affichées.
const GAME_NIGHTS: Date[] = [
  new Date(2026, 8, 11, 20, 30), // 11 sept 2026
  new Date(2026, 9, 2, 20, 30), // 2 oct 2026
  new Date(2026, 10, 6, 20, 30), // 6 nov 2026
  new Date(2026, 11, 4, 20, 30), // 4 déc 2026
  new Date(2027, 0, 8, 20, 30), // 8 jan 2027
  new Date(2027, 1, 5, 20, 30), // 5 fév 2027
  new Date(2027, 2, 12, 20, 30), // 12 mars 2027
  new Date(2027, 3, 2, 20, 30), // 2 avr 2027
  new Date(2027, 4, 14, 20, 30), // 14 mai 2027
  new Date(2027, 5, 4, 20, 30), // 4 juin 2027
  new Date(2027, 6, 2, 20, 30), // 2 juil 2027
];

export function GameNights() {
  const now = new Date();
  const upcoming = GAME_NIGHTS.filter((d) => d >= now).slice(0, 3);

  if (upcoming.length === 0) {
    return null;
  }

  const formatted = upcoming.map((d) =>
    d.toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
  );

  return (
    <Alert
      icon={<Icon>casino</Icon>}
      severity="success"
      sx={{ my: 1, border: "1px solid #bebebeff" }}
    >
      Nouveauté : la ludo organise des <b>soirées jeux</b> les 1<sup>ers</sup> vendredis de chaque
      mois dans <a href="https://maps.app.goo.gl/JzuEXsPYMeR5LShk6">la salle du Bocal</a> (Dans
      l'ancienne poste) à partir de <b>20h30</b>.
      <br />
      Prochaines dates : <b>{formatted.join(" • ")}</b>.
    </Alert>
  );
}

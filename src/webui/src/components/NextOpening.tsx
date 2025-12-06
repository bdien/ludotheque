import Alert from "@mui/material/Alert";
import { differenceInDays } from "date-fns";

interface NextOpeningProps {
  nextopening: string;
}

export function NextOpening(props: NextOpeningProps) {
  if (!props.nextopening) {
    return <></>;
  }

  // Check if we're open now
  const now = new Date();
  const next = new Date(props.nextopening);
  const diffDays = differenceInDays(next, now);
  const isToday = next.toDateString() === now.toDateString();
  const currentTime = now.getHours() + now.getMinutes() / 60;
  const isOpenNow = isToday && currentTime >= 10.5 && currentTime < 12;

  {
    /* Prochaine ouverture */
  }
  return (
    <Alert
      sx={{ my: 1, border: "1px solid #bebebeff" }}
      severity={isOpenNow ? "success" : "info"}
    >
      {isOpenNow ? (
        <>Nous sommes actuellement ouverts jusqu'à 12h !</>
      ) : (
        <>
          Réouverture{" "}
          <b>
            {diffDays < 7
              ? "samedi prochain"
              : next.toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
          </b>{" "}
          de 10h30 à 12h.
        </>
      )}
    </Alert>
  );
}

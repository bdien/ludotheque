import { Alert, AlertColor } from "@mui/material";
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

  // Text
  let nextOpeningText = <></>;
  let alertSeverity = "info";
  if (isOpenNow) {
    alertSeverity = "success";
    nextOpeningText = <>Nous sommes actuellement ouverts jusqu'à 12h !</>;
  } else if (isToday && currentTime < 10.5) {
    alertSeverity = "success";
    nextOpeningText = <>Nous serons ouverts de 10h30 à 12h aujourd'hui !</>;
  } else if (diffDays < 7)
    nextOpeningText = (
      <>
        Réouverture <b>samedi prochain</b> de 10h30 à 12h.
      </>
    );
  else
    nextOpeningText = (
      <>
        Réouverture{" "}
        <b>
          {next.toLocaleString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </b>{" "}
        de 10h30 à 12h.
      </>
    );

  return (
    <Alert
      sx={{ my: 1, border: "1px solid #bebebeff" }}
      severity={alertSeverity as AlertColor}
    >
      {nextOpeningText}
    </Alert>
  );
}

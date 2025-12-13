import Box from "@mui/material/Box";
import { useAuth0 } from "@auth0/auth0-react";
import { useItems } from "../api/hooks";
import { useGlobalStore } from "../hooks/global_store";
import Alert from "@mui/material/Alert";
import { differenceInDays } from "date-fns";
import { ItemListEntry } from "../api/models";
import ItemImage from "../components/ItemImage";
import { Typography } from "@mui/material";
import { NextOpening } from "../components/NextOpening";

export function Main() {
  const { info, account } = useGlobalStore();
  const { isAuthenticated, user } = useAuth0();
  const { items } = useItems({ sort: "created_at", nb: 8 });

  // Filtres les jeux de moins de 3 mois
  let lastitems: ItemListEntry[] = [];
  if (items) {
    lastitems = Array.from(items.values()).filter(
      (i) => differenceInDays(new Date(), i.created_at) <= 90 && i.enabled,
    );
  }

  return (
    <>
      {isAuthenticated && account && !account?.id && (
        <Alert severity="error">
          Nous n'arrivons pas à trouver l'adhérent correspondant à votre email (
          {user?.email}).
          <br />
          Pourriez-vous nous contacter afin de résoudre ce problème ?
        </Alert>
      )}

      {/* Prochaine ouverture */}
      <NextOpening nextopening={info.next_opening} />

      <Box sx={{ pb: 2, textAlign: "justify" }}>
        <p>
          La <b>Ludo du Poisson Lune</b> vous propose un espace jeux pour passer
          un bon moment en famille ou avec les copains...
        </p>
        <p>
          Nous sommes ouverts <b>tous les samedis de 10h30 à 12h</b>, hors les
          samedis du milieu des vacances scolaires et jours fériés, au{" "}
          <b>pôle enfance de la Passerelle</b>,{" "}
          <a href="https://www.google.com/maps/place/48%C2%B008'04.6%22N+1%C2%B032'15.6%22W">
            à proximité du cinéma
          </a>{" "}
          à Acigné. Vous pouvez passer également passer pour jouer sur place.
        </p>
        {isAuthenticated && (
          <p>
            Si vous souhaitez aider aux permanences, n'hésitez pas à vous
            inscrire sur{" "}
            <a href="https://framadate.org/iq7g6GZcr3rECGcC">le planning</a>.
            Les emprunts sont gratuits votre jour de permanence !
          </p>
        )}
        <p>
          La Ludo, c'est un choix de {info ? info.nbitems : "près de 1000"} jeux
          pour tout public (de 9 mois à 99 ans), pour jouer sur place ou à la
          maison.
          <br />
          Vous pouvez nous contacter par e-mail à{" "}
          <a href="mailto:laludodupoissonlune@gmail.com">
            laludodupoissonlune@gmail.com
          </a>
        </p>

        {lastitems.length > 1 && (
          <Box
            sx={{
              backgroundColor: "white",
              px: 1,
              mb: 1,
              width: "100%",
              borderRadius: "8px",
            }}
          >
            <Typography variant="overline" fontSize="1rem">
              Dernières arrivées
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                pb: 1,
                width: "100%",
                gap: "2vw",
              }}
            >
              {lastitems.map((i) => (
                <div style={{ maxWidth: "21vw" }} key={i.id}>
                  <ItemImage id={i.id} />
                </div>
              ))}
            </Box>
          </Box>
        )}

        {info?.pricing && (
          <>
            <p>
              <b>Conditions:</b>
              <br />
            </p>
            <ul>
              <li>
                Adhésion annuelle familiale de {info.pricing.yearly}€ (Caution
                de 40€).
              </li>
              <li>
                Un jeu: {info.pricing.regular}€ pour {info.loan.weeks} semaines
                ({info.loan.maxitems} jeux max en même temps).
              </li>
              <li>
                Carte prépayée (Optionnelle): {info.pricing.card}€ (
                {info.pricing.card / info.pricing.regular} jeux + 1 gratuit).
              </li>
              <li>
                Jeux surdimensionnés:
                <ul>
                  <li>{info.pricing.big}€ pour les adhérents</li>
                  <li>
                    {info.pricing.big_associations}€ pour les associations
                  </li>
                  <li>
                    Caution (non-encaissée):
                    <ul>
                      <li>1 Jeu: 80€</li>
                      <li>2 Jeux et plus: 50€ + 50€/jeu</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </>
        )}
      </Box>

      <img
        src="/photomain.webp"
        alt="Logo Picture"
        fetchPriority="high"
        style={{ maxWidth: "50vw", borderRadius: "2%" }}
      />
    </>
  );
}

import Box from "@mui/material/Box";
import { useAuth0 } from "@auth0/auth0-react";
import { useInfo, useAccount, useItems } from "../api/hooks";
import Alert from "@mui/material/Alert";
import { differenceInDays } from "date-fns";
import { ItemListEntry } from "../api/models";
import ItemImage from "../components/ItemImage";
import { Typography } from "@mui/material";

export function Main() {
  const { info } = useInfo();
  const { isAuthenticated, user } = useAuth0();
  const { account } = useAccount();
  const { items } = useItems({ sort: "created_at", nb: 4 });

  // Filtres les jeux de moins de 3 mois
  var lastitems: ItemListEntry[] = [];
  if (items) {
    var lastitems = Array.from(items.values()).filter(
      (i) => differenceInDays(new Date(), i.created_at) <= 90,
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
      <Box sx={{ pb: 2, textAlign: "justify" }}>
        <p>
          Pour passer un bon moment en famille ou avec les copains...
          <br />
          <br />
          La<b> Ludo du Poisson Lune</b> vous propose un espace jeux.
          <br />
          Nous sommes ouverts <b> tous les samedis de 10h30 à 12h00</b>, hors
          les samedis du milieu des vacances scolaires, au{" "}
          <b>pôle enfance de la Passerelle</b>, à proximité de la médiathèque à
          Acigné. Vous pouvez passer également passer pour jouer sur place !
        </p>
        <p>
          La Ludo, c'est un choix de{" "}
          <b>{info ? info.nbitems : "près de 1000"} jeux</b> pour tout public
          (de 9 mois à 99 ans), pour jouer sur place ou à la maison.
        </p>
        <p>
          Vous pouvez nous contacter par e-mail à{" "}
          <a href="mailto:laludodupoissonlune@gmail.com">
            laludodupoissonlune@gmail.com
          </a>
        </p>

        {lastitems.length > 1 && (
          <Box
            sx={{ backgroundColor: "white", px: 1, mb: 1, borderRadius: "8px" }}
          >
            <Typography variant="overline" fontSize="1rem">
              Dernières arrivées
            </Typography>
            <Box
              sx={{ display: "flex", pb: 1, maxHeight: "15vh", gap: "10px" }}
            >
              {lastitems.map((i) => (
                <ItemImage id={i.id} />
              ))}
            </Box>
          </Box>
        )}

        <img
          src="/photomain.webp"
          alt="Logo Picture"
          style={{ maxWidth: "100%", borderRadius: "2%" }}
        />
        {info?.pricing && (
          <>
            <p>
              <b>Conditions:</b>
              <br />
            </p>
            <ul>
              <li>Adhésion annuelle familiale de {info.pricing.yearly}€.</li>
              <li>
                Un jeu: {info.pricing.regular}€ pour {info.loan.weeks} semaines.
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
                    Caution (chèque non-encaissé)
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
    </>
  );
}

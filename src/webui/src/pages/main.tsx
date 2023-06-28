import Box from "@mui/material/Box";
import { useAuth0 } from "@auth0/auth0-react";
import { useInfo, useAccount } from "../api/hooks";
import Alert from "@mui/material/Alert";

export function Main() {
  const { info } = useInfo();
  const { isAuthenticated, user } = useAuth0();
  const { account } = useAccount();

  return (
    <>
      {isAuthenticated && !account?.id && (
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
          Acigné.
        </p>
        <p>
          La Ludo, c'est un choix de{" "}
          <b>{info ? info.nbitems : "près de 995"} jeux</b> pour tout public (de
          9 mois à 99 ans), pour jouer sur place ou à la maison.
        </p>
        <p>
          Vous pouvez nous contacter via l'adresse suivante :<br />{" "}
          <b>
            <a href="mailto:laludodupoissonlune@gmail.com">
              laludodupoissonlune@gmail.com
            </a>
          </b>
        </p>
        <img
          src="/photomain.jpg"
          alt="Logo Picture"
          style={{ maxWidth: "100%" }}
        />
        {info?.pricing && (
          <>
            <p>
              <b>Tarifs:</b>
              <br />
            </p>
            <ul>
              <li>Adhésion annuelle familiale de {info.pricing.yearly}€.</li>
              <li>Un jeu: {info.pricing.regular}€.</li>
              <li>
                Carte d'abonnement: {info.pricing.card}€ (
                {info.pricing.card / info.pricing.regular} jeux + 1 gratuit).
              </li>
              <li>
                Jeux surdimensionnés:
                <ul>
                  <li>{info.pricing.big}€ pour les adhérents</li>
                  <li>
                    {info.pricing.big_associations}€ pour les associations
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

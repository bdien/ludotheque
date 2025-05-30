import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

export function Documents() {
  return (
    <Box>
      <p>
        Vous trouverez ici les principaux documents que vous pouvez imprimer.
        <br />
        Les fichiers sources sont généralement sur le Drive de la ludothèque.
      </p>

      <Box sx={{ p: 2 }}>
        <Link href="/docs/ludo_fiche_adherent.pdf">
          <Stack alignItems="center" direction="row" gap={1}>
            <Icon fontSize="large">description</Icon>
            Fiche nouvel adhérent
          </Stack>
        </Link>
      </Box>

      <Box sx={{ p: 2 }}>
        <Link href="/docs/ludo_location_jeux_surdim.pdf">
          <Stack alignItems="center" direction="row" gap={1}>
            <Icon fontSize="large">description</Icon>
            Location de Jeux Surdimensionnés
          </Stack>
        </Link>
      </Box>

      <Box sx={{ p: 2 }}>
        <Link href="/docs/ludo_accueil_arrivants.pdf">
          <Stack alignItems="center" direction="row" gap={1}>
            <Icon fontSize="large">description</Icon>
            Accueil Nouvel adhérents
          </Stack>
        </Link>
      </Box>

      <Box sx={{ p: 2 }}>
        <Link href="https://docs.google.com/spreadsheets/d/1G8smBWLbcLIQwFoR6EiAawQDAAPJjQQIdLczJ1gcPN8">
          <Stack alignItems="center" direction="row" gap={1}>
            <Icon fontSize="large">grid_on</Icon>
            Listes des Adhérents et Jeux
          </Stack>
        </Link>
      </Box>
    </Box>
  );
}

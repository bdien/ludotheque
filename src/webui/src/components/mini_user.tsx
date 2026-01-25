import { User } from "../api/models";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import { useState } from "react";
import Link from "@mui/material/Link";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Alert from "@mui/material/Alert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import { useGlobalStore } from "../hooks/global_store";

interface MiniUserProps {
  user: User;
  display_loans?: boolean | null;
  onRemove?: ((event: React.MouseEvent<HTMLElement>) => void) | null;
}

function emailLate(user: User) {
  if (!user.emails) return "";

  // Can be NaN if user.last_warning is NULL
  let last_warning_days = 99;
  if (user.last_warning) {
    last_warning_days = differenceInDays(new Date(), user.last_warning);
    if (last_warning_days == 0) return ` - Courriel envoyé aujourd'hui`;
    if (last_warning_days < 15)
      return ` - Courriel envoyé il y a ${last_warning_days}j`;
  }

  return (
    <>
      {" - "}{" "}
      <Link
        href={`/users/${user.id}/email`}
        sx={{ textDecoration: "none", cursor: "pointer" }}
      >
        Envoyer un email
      </Link>
      {last_warning_days < 60
        ? ` (Envoyé il y a ${Math.ceil(last_warning_days / 7)} sem)`
        : ""}
    </>
  );
}

export function MiniUser(props: MiniUserProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { info, account } = useGlobalStore();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpened = Boolean(anchorEl);
  const menuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const menuClose = () => {
    setAnchorEl(null);
  };

  const today = new Date();
  const late_loans = props.user?.loans?.filter(
    (i) => differenceInDays(today, i.stop) > 0,
  ).length;
  const verylate_loans = props.user?.loans?.filter(
    (i) => differenceInDays(today, i.stop) >= (info?.email_minlate ?? 15),
  ).length;

  return (
    <>
      <Box component={Paper} display="flex" sx={{ p: "1em" }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            component="span"
            variant="h5"
            fontWeight={500}
            sx={{
              mb: 0.5,
              textDecoration: props.user.enabled ? "" : "line-through",
            }}
          >
            {props.user.name}

            {/* Icone admin/bureau */}
            {props.user.role == "admin" && (
              <Icon fontSize="small" sx={{ ml: 0.3 }}>
                star
              </Icon>
            )}

            {/* Icone bénévole */}
            {props.user.role == "benevole" && (
              <Icon fontSize="small" sx={{ ml: 0.3 }}>
                star_half
              </Icon>
            )}

            {/* Icone désactivé */}
            {!props.user.enabled && (
              <Icon fontSize="small" color="warning" sx={{ ml: 0.3 }}>
                cancel
              </Icon>
            )}
          </Typography>

          {/* Secondary (Emprunts, Carte, Adhésion) */}
          <Box
            sx={{
              color: "text.secondary",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {/* Nombre d'emprunts */}
            {(props.display_loans ?? true) ? (
              <Box sx={{ mr: 1, display: "flex" }}>
                <Icon sx={{ mr: "0.15em" }}>local_offer</Icon>
                <Typography
                  component="span"
                  fontWeight={500}
                  sx={{ mr: "0.6ch" }}
                >
                  {props.user?.loans?.length}
                </Typography>
                emprunt
                {props.user.loans && props.user?.loans?.length > 1 ? "s" : ""}
              </Box>
            ) : (
              ""
            )}

            {/* Credit sur la carte */}
            <Box sx={{ mr: 1, display: "flex" }}>
              <Icon sx={{ mr: "0.15em" }}>savings</Icon>
              <Typography
                component="span"
                fontWeight={500}
                sx={{ mr: "0.6ch" }}
              >
                {props.user?.credit}€
              </Typography>
            </Box>

            {/* Fin de l'adhésion */}
            {props.user?.subscription && (
              <>
                <Box sx={{ mr: 1, display: "flex" }}>
                  <Icon sx={{ mr: "0.15em" }}>event</Icon>
                  {new Date(props.user.subscription).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Action sur le user: Delete ou Details */}
        <Box>
          {props.onRemove ? (
            <IconButton onClick={props.onRemove} sx={{ p: 0 }}>
              <Icon sx={{ color: "text.secondary", opacity: 0.7 }}>clear</Icon>
            </IconButton>
          ) : (
            <>
              <IconButton sx={{ p: 0 }} onClick={menuClick}>
                <Icon>more_vert</Icon>
              </IconButton>
              <Menu anchorEl={anchorEl} open={menuOpened} onClose={menuClose}>
                <MenuItem
                  onClick={() => {
                    menuClose();
                    setModalOpen(true);
                  }}
                >
                  Détails
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {/* Notes */}
      {props.user.notes && (
        <Alert elevation={1} severity="info" sx={{ my: 1 }}>
          {props.user.notes}
        </Alert>
      )}

      {/* Utilisateur désactivé */}
      {!props.user?.enabled && (
        <Alert elevation={1} severity="error" sx={{ my: 1 }}>
          Utilisateur désactivé
        </Alert>
      )}

      {/* Emprunts en retard  */}
      {late_loans ? (
        <Alert elevation={1} severity="error" sx={{ my: 1 }}>
          {late_loans} jeu{late_loans > 1 ? "x" : ""} en retard
          {/* Emails pour retard */}
          {account?.role == "admin" && verylate_loans
            ? emailLate(props.user)
            : ""}
        </Alert>
      ) : (
        ""
      )}

      {/* Adhésion en retard */}
      {props.user?.subscription &&
        new Date(props.user?.subscription) <= today && (
          <Alert elevation={1} severity="error" sx={{ my: 1 }}>
            Adhésion expirée{" "}
            {formatDistanceToNow(props.user?.subscription, {
              locale: fr,
              addSuffix: true,
            })}
          </Alert>
        )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            p: 3,
            minWidth: "200px",
          }}
        >
          <h2>Détails</h2>
          Identifiant interne: {props.user.id}
          {props.user?.emails && (
            <>
              <h3>Emails</h3>
              <ul>
                {props.user?.emails?.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </>
          )}
          {props.user?.informations && (
            <>
              <h3>Informations</h3>
              <Box sx={{ whiteSpace: "pre-wrap" }}>
                {props.user?.informations}
              </Box>
            </>
          )}
          <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button onClick={() => setModalOpen(false)}>Fermer</Button>
          </Grid>
        </Paper>
      </Modal>
    </>
  );
}

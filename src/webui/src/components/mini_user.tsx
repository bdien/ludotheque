import { UserModel } from "../api/models";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Popover from "@mui/material/Popover";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "@mui/material/Link";
import { useAccount } from "../api/hooks";
import dayjs from "dayjs";

interface MiniUserProps {
  user: UserModel;
  fullDetails?: boolean | null;
  onRemove?: ((event: React.MouseEvent<HTMLElement>) => void) | null;
  history: boolean;
}

const today = new Date();

function emailLate(user: UserModel) {
  if (!user.emails) return "";

  // Can be NaN if user.last_warning is NULL
  const last_warning_days = dayjs().diff(user.last_warning, "days");
  if (last_warning_days == 0) return ` - Courriel envoyé aujourd'hui`;
  if (last_warning_days < 15)
    return ` - Courriel envoyé il y a ${last_warning_days}j`;

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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const popoverOpen = Boolean(anchorEl);
  const late_loans = props.user?.loans?.filter((i) => dayjs().diff(i.stop) > 0)
    .length;
  const verylate_loans = props.user?.loans?.filter(
    (i) => dayjs().diff(i.stop, "days") > 14,
  ).length;
  const { account } = useAccount();

  return (
    <Grid
      container
      spacing={0}
      columns={16}
      component={Paper}
      display="flex"
      sx={{ m: 0, mt: 0.5, p: 1.6 }}
    >
      <Grid flexGrow={1}>
        <Link
          href={`/users/${props.user.id}`}
          style={{ textDecoration: "none" }}
        >
          <Typography
            color="primary.main"
            component="span"
            variant="h5"
            fontWeight={500}
            sx={{ mb: 0.5 }}
          >
            {/* User ID */}
            {props.fullDetails && `[${props.user.id}] `}

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
          </Typography>
        </Link>

        <Box sx={{ color: "text.secondary" }}>
          {/* Email + Additional information */}
          {props.fullDetails && (
            <Box>
              {props.user?.emails?.join(", ")}
              {props.user?.informations && (
                <>
                  <span> - </span>
                  <Link
                    component="button"
                    onClick={(evt: React.MouseEvent<HTMLButtonElement>) =>
                      setAnchorEl(evt.currentTarget)
                    }
                  >
                    plus d'informations
                  </Link>
                </>
              )}
            </Box>
          )}

          {/* Pop-Over avec les infos additionnelles */}
          <Popover
            id="popover_moreinfo"
            open={popoverOpen}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Box sx={{ mr: 2 }}>
              <ReactMarkdown>
                {props.user?.informations || "Vide"}
              </ReactMarkdown>
            </Box>
          </Popover>

          {/* Emprunts */}
          {props.user?.loans && props.user?.loans?.length > 0 && (
            <Box>
              <Typography component="span" fontWeight={500}>
                {props.user?.loans?.length}{" "}
              </Typography>
              emprunt{props.user?.loans?.length > 1 ? "s" : ""}
              {/* Emprunts en retard */}
              {late_loans ? (
                <>
                  <Box
                    sx={{ ml: "0.3em", color: "warning.main" }}
                    component="span"
                    className="redblink"
                  >
                    (
                    <Typography component="span" fontWeight={500}>
                      {late_loans}
                    </Typography>{" "}
                    en retard)
                  </Box>

                  {/* Emails pour retard (au moins 15j) */}
                  {account?.role == "admin" && verylate_loans
                    ? emailLate(props.user)
                    : ""}
                </>
              ) : (
                ""
              )}
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {props.user?.credit > 0 && (
              <Box sx={{ mr: 1 }}>
                <Typography component="span" fontWeight={500}>
                  {props.user?.credit}€
                </Typography>{" "}
                sur la carte
              </Box>
            )}

            {/* Fin de l'abonnement */}
            {props.user?.subscription && (
              <>
                <Icon sx={{ mr: "0.2em" }}>event</Icon>
                <Box
                  component="span"
                  className={
                    new Date(props.user?.subscription) <= today
                      ? "redblink"
                      : ""
                  }
                >
                  {new Date(props.user.subscription).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </Box>
              </>
            )}

            {/* Historique */}
            {props.history ? (
              <>
                <Icon sx={{ ml: "0.4em", mr: "0.1em" }}>hourglass_empty</Icon>
                <Link
                  href={`/users/${props.user.id}/history`}
                  sx={{ textDecoration: "none", cursor: "pointer" }}
                >
                  Historique
                </Link>
              </>
            ) : (
              ""
            )}
          </Box>
        </Box>
        {props.user.notes ? (
          <Box sx={{ backgroundColor: "#EEEEEE", my: 1, p: 1 }}>
            {props.user.notes}
          </Box>
        ) : (
          ""
        )}
      </Grid>
      {props.onRemove && (
        <Box>
          <IconButton onClick={props.onRemove} sx={{ p: 0 }}>
            <Icon sx={{ color: "text.secondary", opacity: 0.7 }}>delete</Icon>
          </IconButton>
        </Box>
      )}
    </Grid>
  );
}

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

interface MiniUserProps {
  user: UserModel;
  fullDetails?: boolean | null;
  onRemove?: any | null;
}

export function MiniUser(props: MiniUserProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const popoverOpen = Boolean(anchorEl);
  const today = new Date();
  const late_loans = props.user?.loans?.filter((i) => new Date(i.stop) < today)
    .length;

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

        <Box sx={{ color: "text.secondary" }}>
          {/* Email + Additional information */}
          {props.fullDetails && (
            <Box>
              {props.user?.email}
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
              {late_loans ? (
                <Box
                  sx={{ ml: "0.3em", color: "warning.main" }}
                  component="span"
                >
                  (
                  <Typography component="span" fontWeight={500}>
                    {late_loans}
                  </Typography>{" "}
                  en retard)
                </Box>
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
            {props.user?.subscription && (
              <>
                <Icon sx={{ mr: "0.2em" }}>event</Icon>
                <Box
                  component="span"
                  color={
                    new Date(props.user?.subscription) <= today
                      ? "warning.main"
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

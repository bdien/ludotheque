import { UserModel } from "../api/models";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

interface MiniUserProps {
  user: UserModel;
  fullDetails?: boolean | null;
  onRemove?: any | null;
}

export function MiniUser(props: MiniUserProps) {
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
      sx={{ m: 0, mt: 1, mb: 2, p: 2 }}
    >
      <Grid flexGrow={1}>
        <Typography variant="h5" fontWeight={500}>
          {props.user.name}
        </Typography>
        <Box sx={{ color: "text.secondary" }}>
          {props.fullDetails && <Box>{props.user?.email}</Box>}

          {props.user?.loans && props.user?.loans?.length > 0 && (
            <Box>
              <Typography component="span" fontWeight={500}>
                {props.user?.loans?.length}{" "}
              </Typography>
              prêts
              {late_loans && (
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
      </Grid>
      {props.onRemove && (
        <Box>
          <IconButton onClick={props.onRemove}>
            <Icon>close</Icon>
          </IconButton>
        </Box>
      )}
    </Grid>
  );
}

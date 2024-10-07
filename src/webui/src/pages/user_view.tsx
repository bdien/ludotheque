import MiniItem from "../components/mini_item";
import { useAccount, useUser } from "../api/hooks";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import { MiniUser } from "../components/mini_user";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { navigate } from "wouter/use-browser-location";
import { Loading } from "../components/loading";
import { Typography } from "@mui/material";

interface UserViewProps {
  id: number;
}

export function UserView(props: UserViewProps) {
  const { account } = useAccount();
  const { user, error } = useUser(props.id);
  const today = new Date();

  if (error) return <div>Impossible de charger: {error}</div>;
  if (!user) return <Loading />;

  return (
    <>
      <MiniUser fullDetails={true} user={user} />

      {/* Loans */}
      <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 2 }}>
        {user.loans?.length ? (
          user.loans?.map((obj) => {
            const objstop = new Date(obj.stop);
            return (
              <MiniItem
                key={obj.id}
                id={obj.item}
                late={objstop <= today}
                subtext={
                  "A rendre le " +
                  objstop.toLocaleDateString("fr", {
                    year: objstop < today ? "numeric" : undefined,
                    month: "short",
                    day: "numeric",
                  })
                }
                action={
                  account?.role == "admin" || account?.role == "benevole"
                    ? {
                        text: "Rendre",
                        func: () => {
                          navigate(
                            `/loans/${obj.id}/close?return=${window.location.pathname}`,
                          );
                        },
                      }
                    : undefined
                }
              />
            );
          })
        ) : (
          <Box sx={{ mx: "auto", textAlign: "center" }}>
            <Icon sx={{ opacity: 0.1, fontSize: "min(50vw, 300px)", mt: 4 }}>
              info
            </Icon>
            <br />
            Pas d'emprunts en cours
          </Box>
        )}
      </Box>

      {/* Bookings */}
      {user.bookings.length > 0 && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="overline" fontSize="1.2rem" color="primary">
            Réservations
          </Typography>
          <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 2 }}>
            {user.bookings.map((obj) => (
              <MiniItem
                key={obj.item}
                id={obj.item}
                subtext={
                  "Réservé le " +
                  new Date(obj.created_at).toLocaleDateString("fr", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                }
                action={{
                  text: "Annuler",
                  func: () => {},
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Edit button */}
      {(account?.role == "admin" || account?.role == "benevole") && (
        <SpeedDial
          ariaLabel="Actions"
          sx={{
            position: "fixed",
            bottom: (theme) => theme.spacing(2),
            right: (theme) => theme.spacing(2),
          }}
          icon={<SpeedDialIcon />}
        >
          {account?.role == "admin" ? (
            <SpeedDialAction
              key="edit"
              tooltipOpen={true}
              icon={<Icon>edit</Icon>}
              tooltipTitle="Edition"
              onClick={() => {
                navigate(`/users/${user.id}/edit`);
              }}
            />
          ) : (
            ""
          )}
          <SpeedDialAction
            key="emprunter"
            tooltipOpen={true}
            icon={<Icon>logout</Icon>}
            tooltipTitle="Faire un emprunt"
            onClick={() => {
              navigate(`/loans/new?user=${user.id}`);
            }}
          />
        </SpeedDial>
      )}
    </>
  );
}

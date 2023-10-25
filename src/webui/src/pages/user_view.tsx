import MiniItem from "../components/mini_item";
import { useAccount, useUser } from "../api/hooks";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import { MiniUser } from "../components/mini_user";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { navigate } from "wouter/use-location";

interface UserViewProps {
  id: number;
}

export function UserView(props: UserViewProps) {
  const { account } = useAccount();
  const { user, isLoading, error } = useUser(props.id);

  if (error) return <div>Impossible de charger: {error}</div>;
  if (isLoading) return <div>Chargement...</div>;
  if (!user) return <div>Erreur du serveur</div>;

  return (
    <>
      <MiniUser fullDetails={true} user={user} history={true} />

      <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 2 }}>
        {user?.loans?.length ? (
          user?.loans?.map((obj) => <MiniItem key={obj.id} id={obj.item} />)
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
          <SpeedDialAction
            key="edit"
            tooltipOpen={true}
            icon={<Icon>edit</Icon>}
            tooltipTitle="Edition"
            onClick={() => navigate(`/users/${user.id}/edit`)}
          />
          <SpeedDialAction
            key="emprunter"
            tooltipOpen={true}
            icon={<Icon>logout</Icon>}
            tooltipTitle="Faire un emprunt"
            onClick={() => navigate(`/loans/new?user=${user.id}`)}
          />
        </SpeedDial>
      )}
    </>
  );
}

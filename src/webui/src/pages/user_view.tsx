import MiniItem from "../components/mini_item";
import { useUser } from "../api/hooks";
import { useGlobalStore } from "../hooks/global_store";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import { MiniUser } from "../components/mini_user";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { navigate } from "wouter/use-browser-location";
import { Loading } from "../components/loading";
import { Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useState } from "react";
import { UserHistory } from "../components/user_history";
import { UserLoans } from "../components/user_loans";
import { unfavItem } from "../api/calls";

interface UserViewProps {
  id: number;
}

export function UserView(props: UserViewProps) {
  const { account } = useGlobalStore();
  const { user, error, mutate } = useUser(props.id);
  const [tabIndex, setTabIndex] = useState("loans");

  if (error) return <div>Impossible de charger: {error}</div>;
  if (!user || !mutate) return <Loading />;

  if (user.favorites.length == 0 && tabIndex == "favorites")
    setTabIndex("loans");

  return (
    <>
      <MiniUser display_loans={false} user={user} />

      <TabContext value={tabIndex}>
        {/* Only display tabs for current user or admin */}
        {(account?.id == user.id || account?.role == "admin") && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              variant="fullWidth"
              onChange={(_event, value) => setTabIndex(value)}
            >
              <Tab label="Emprunts" value="loans" />
              {user.favorites.length > 0 && (
                <Tab label="Favoris" value="favorites" />
              )}
              <Tab label="Historique" value="history" />
              {user.bookings.length > 0 && (
                <Tab label="Resas" value="bookings" />
              )}
            </TabList>
          </Box>
        )}

        <TabPanel value="loans" sx={{ p: 0, pt: 2 }}>
          <UserLoans
            loans={user.loans ?? []}
            buttons={account?.role == "admin" || account?.role == "benevole"}
          />
        </TabPanel>

        <TabPanel value="favorites" sx={{ p: 0, pt: 2 }}>
          <Box display="flex" flexWrap="wrap">
            {user.favorites.map((objid) => (
              <MiniItem
                key={objid}
                id={objid}
                action={{
                  text: <Icon>heart_broken</Icon>,
                  func: () => {
                    unfavItem(objid).then(() => mutate());
                  },
                }}
              />
            ))}
          </Box>
        </TabPanel>

        <TabPanel value="history" sx={{ p: 0, pt: 1 }}>
          <UserHistory id={user.id} />
        </TabPanel>

        <TabPanel value="bookings" sx={{ p: 0, pt: 2 }}>
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
        </TabPanel>
      </TabContext>

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

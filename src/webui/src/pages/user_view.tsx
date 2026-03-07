import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Tab } from "@mui/material";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { useUser } from "../api/hooks";
import { Loading } from "../components/loading";
import MiniItem from "../components/mini_item";
import { MiniUser } from "../components/mini_user";
import { UserHistory } from "../components/user_history";
import { UserLoans } from "../components/user_loans";
import { useGlobalStore } from "../hooks/global_store";

interface UserViewProps {
  id: number;
}

export function UserView(props: UserViewProps) {
  const { account } = useGlobalStore();
  const { user, error, mutate } = useUser(props.id);
  const [tabIndex, setTabIndex] = useState("loans");

  if (error) return <div>Impossible de charger: {error}</div>;
  if (!user || !mutate) return <Loading />;

  return (
    <>
      <MiniUser display_loans={false} user={user} />

      <TabContext value={tabIndex}>
        {/* Only display tabs if allowed */}
        {(account?.id === user.id || account?.rights.includes("user_list")) && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList variant="fullWidth" onChange={(_event, value) => setTabIndex(value)}>
              <Tab label="Emprunts" value="loans" />
              {(account?.id === user.id || account?.rights.includes("user_manage")) && (
                <Tab label="Historique" value="history" />
              )}
              {user.bookings && user.bookings.length > 0 && <Tab label="Resas" value="bookings" />}
            </TabList>
          </Box>
        )}

        <TabPanel value="loans" sx={{ p: 0, pt: 2 }}>
          <UserLoans
            userId={user.id}
            loans={user.loans ?? []}
            buttons={account?.rights.includes("loan_manage")}
          />
        </TabPanel>

        <TabPanel value="history" sx={{ p: 0, pt: 1 }}>
          <UserHistory id={user.id} />
        </TabPanel>

        <TabPanel value="bookings" sx={{ p: 0, pt: 2 }}>
          <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 2 }}>
            {user.bookings?.map((obj) => (
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
                  func: () => {
                    console.log("TODO");
                  },
                }}
              />
            ))}
          </Box>
        </TabPanel>
      </TabContext>

      {/* Edit button */}
      {account?.rights.includes("user_manage") && (
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
            icon={<Icon>edit</Icon>}
            slotProps={{ tooltip: { open: true, title: "Edition" } }}
            onClick={() => {
              navigate(`/users/${user.id}/edit`);
            }}
          />
          <SpeedDialAction
            key="emprunter"
            icon={<Icon>logout</Icon>}
            slotProps={{ tooltip: { open: true, title: "Faire un emprunt" } }}
            onClick={() => {
              navigate(`/loans/new?user=${user.id}`);
            }}
          />
        </SpeedDial>
      )}
    </>
  );
}

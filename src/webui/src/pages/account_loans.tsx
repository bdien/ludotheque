import { useAuth0 } from "@auth0/auth0-react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import Icon from "@mui/material/Icon";
import { useEffect, useState } from "react";
import { useUser } from "../api/hooks";
import { Loading } from "../components/loading";
import { UserHistory } from "../components/user_history";
import { UserLoans } from "../components/user_loans";
import { useGlobalStore } from "../hooks/global_store";

export function AccountLoans() {
  const { account } = useGlobalStore();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { user, isLoading, error } = useUser(account?.id || 0);
  const [tabIndex, setTabIndex] = useState("loans");

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
    }
  }, [isAuthenticated, loginWithRedirect]);

  if (!isAuthenticated) return <Loading />;
  if (isLoading || !user) {
    if (error) return <div>Impossible de charger: {String(error)}</div>;
    return <Loading />;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Icon>history</Icon> Mes emprunts
      </Typography>

      <TabContext value={tabIndex}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList variant="fullWidth" onChange={(_, v) => setTabIndex(v)}>
            <Tab label="Emprunts" value="loans" />
            <Tab label="Historique" value="history" />
          </TabList>
        </Box>

        <TabPanel value="loans" sx={{ p: 0, pt: 2 }}>
          <UserLoans
            userId={user.id}
            loans={user.loans ?? []}
            buttons={!!account?.rights.includes("loan_manage")}
          />
        </TabPanel>

        <TabPanel value="history" sx={{ p: 0, pt: 1 }}>
          <UserHistory id={user.id} />
        </TabPanel>
      </TabContext>
    </Box>
  );
}

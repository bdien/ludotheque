import { Route, Switch } from "wouter";
import { TopBar } from "./components/topbar";
import { Loan } from "./pages/loan";
import { Item } from "./pages/item_view";
import { ItemList } from "./pages/item_list";
import { ItemEdit } from "./pages/item_edit";
import { UserList } from "./pages/user_list";
import { UserEdit } from "./pages/user_edit";
import { UserView } from "./pages/user_view";
import { Ledger } from "./pages/ledger";
import { Box, Toolbar } from "@mui/material";
import { Main } from "./pages/main";
import { LoanClose } from "./pages/loan_close";
import { getAccount, setToken } from "./api/calls";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useInfo } from "./api/hooks";
import "./styles.css";
import { LateLoans } from "./pages/late_loans";
import { LateEmail } from "./pages/late_email";
import { Stats } from "./pages/stats";
import { Documents } from "./pages/documents";
import { Inventory } from "./pages/inventory";
import { useGlobalStore } from "./hooks/global_store";
import { LessLoaned } from "./pages/lessloaned";
import { InventoryRev } from "./pages/inventoryrev";
import { UserMyAccount } from "./pages/user_myaccount";

function App() {
  const { info } = useInfo();
  const [authdone, setAuthDone] = useState(false);
  const globalStoreSetAccount = useGlobalStore((state) => state.setAccount);
  const globalStoreSetInfo = useGlobalStore((state) => state.setInfo);
  const { isAuthenticated, isLoading, getAccessTokenSilently, logout } =
    useAuth0();

  // If info has changed, update global store
  useEffect(() => {
    if (info) {
      globalStoreSetInfo(info);
    }
  }, [info]);

  // If user authentication changed
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      globalStoreSetAccount({ id: 0, role: "" });
      setAuthDone(true);
    } else {
      getAccessTokenSilently()
        .then((token) => {
          setToken(token);
          getAccount().then((data) => {
            globalStoreSetAccount(data);
            setAuthDone(true);
          });
        })
        .catch(() => {
          logout();
          setAuthDone(true);
        });
    }
  }, [isLoading, isAuthenticated]);

  // Do not display anything if /info and /account are not done
  if (!info || !authdone) {
    return <></>;
  }

  return (
    <Box
      height="100dvh"
      width="100dvw"
      display="flex"
      sx={{ mx: "auto", maxWidth: 1700 }}
    >
      <TopBar width={225} />

      <Box
        component="main"
        sx={{
          height: "calc(100dvh - 110px)",
          flexGrow: 1,
          p: 1,
          width: { sm: `calc(100% - 240px)` },
          overflowX: "clip",
        }}
      >
        <Toolbar />
        <Switch>
          <Route path="/users" component={UserList} />
          <Route path="/users/new">
            {() => {
              return <UserEdit />;
            }}
          </Route>
          <Route path="/users/:id">
            {(params) => {
              return <UserView id={parseInt(params.id)} />;
            }}
          </Route>
          <Route path="/users/:id/email">
            {(params) => {
              return <LateEmail id={parseInt(params.id)} />;
            }}
          </Route>
          <Route path="/users/:id/edit">
            {(params) => {
              return <UserEdit id={parseInt(params.id)} />;
            }}
          </Route>

          <Route path="/items" component={ItemList} />
          <Route path="/items/new">
            {() => {
              return <ItemEdit />;
            }}
          </Route>
          <Route path="/items/:id">
            {(params) => {
              return <Item id={parseInt(params.id)} />;
            }}
          </Route>
          <Route path="/items/:id/edit">
            {(params) => {
              return <ItemEdit id={parseInt(params.id)} />;
            }}
          </Route>

          <Route path="/loans/new" component={Loan} />
          <Route path="/loans/late" component={LateLoans} />
          <Route path="/loans/:id/close">
            {(params) => {
              return <LoanClose id={parseInt(params.id)} />;
            }}
          </Route>

          <Route path="/ledger" component={Ledger} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/inventoryrev" component={InventoryRev} />
          <Route path="/lessloaned" component={LessLoaned} />
          <Route path="/documents" component={Documents} />
          <Route path="/stats" component={Stats} />
          <Route path="/myaccount" component={UserMyAccount} />

          <Route path="/" component={Main} />
        </Switch>

        {/* Only way I found to keep some space at the very bottom */}
        <Box height="10px"></Box>
      </Box>
    </Box>
  );
}

export default App;

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
import { setToken } from "./api/calls";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { useInfo } from "./api/hooks";
import "./styles.css";
import { LateLoans } from "./pages/late_loans";
import { UserHistory } from "./pages/user_history";
import { LateEmail } from "./pages/late_email";
import { Stats } from "./pages/stats";

function App() {
  const { isLoading: infoIsLoading } = useInfo();
  const [authdone, setAuthDone] = useState(false);
  const { isAuthenticated, isLoading, getAccessTokenSilently, logout } =
    useAuth0();

  // Wait for authentication to be finished (including token)
  if (!authdone && !isLoading) {
    if (!isAuthenticated) {
      setAuthDone(true);
    } else {
      getAccessTokenSilently()
        .then((token) => {
          setToken(token);
          setAuthDone(true);
        })
        .catch(() => {
          logout();
          setAuthDone(true);
        });
    }
  }

  if (!authdone || infoIsLoading) {
    return <></>;
  }

  return (
    <Box
      height="100vh"
      width="100vw"
      display="flex"
      sx={{ mx: "auto", maxWidth: 1700 }}
    >
      <TopBar width={225} />

      <Box
        component="main"
        sx={{
          height: "calc(100vh - 130px)",
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
          <Route path="/users/:id/history">
            {(params) => {
              return <UserHistory id={parseInt(params.id)} />;
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

          <Route path="/stats" component={Stats} />

          <Route path="/" component={Main} />
        </Switch>
      </Box>
    </Box>
  );
}

export default App;

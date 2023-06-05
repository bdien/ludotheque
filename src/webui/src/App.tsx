import { Route, Switch } from "wouter";
import { TopBar } from "./components/topbar";
import { Loan } from "./pages/loan";
import { ItemList } from "./pages/item_list";
import { Item } from "./pages/item_view";
import { ItemEdit } from "./pages/item_edit";
import { UserList } from "./pages/user_list";
import { UserCreate } from "./pages/user_create";
import { UserView } from "./pages/user_view";
import { Box, Toolbar } from "@mui/material";
import { Main } from "./pages/main";

function App() {
  return (
    <Box height="100vh" display="flex">
      <TopBar width={220} />

      <Box
        component="main"
        sx={{
          height: "calc(100vh - 130px)",
          flexGrow: 1,
          p: 2,
          width: { sm: `calc(100% - 240px)` },
        }}
      >
        <Toolbar />
        <Switch>
          <Route path="/users" component={UserList} />
          <Route path="/users/new" component={UserCreate} />
          <Route path="/users/:id">
            {(params) => {
              return <UserView id={parseInt(params.id)} />;
            }}
          </Route>
          <Route path="/items" component={ItemList} />
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
          <Route path="/" component={Main} />
        </Switch>
      </Box>
    </Box>
  );
}

export default App;

import Profile from "./components/profile";
import TopBar from "./components/topbar";
import { Box, Container } from "@mui/material";
import { Route, Switch } from "wouter";
import { Loan } from "./pages/loan";
import { ItemList } from "./pages/item_list";
import { UserCreate } from "./pages/user_create";
import { Item } from "./pages/item_view";
import { ItemEdit } from "./pages/item_edit";
import { UserList } from "./pages/user_list";

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar />

      <Container disableGutters={true}>
        <Switch>
          <Route path="/me" component={Profile} />

          <Route path="/users" component={UserList} />
          <Route path="/users/new" component={UserCreate} />
          <Route path="/users/:id">
            {(params) => {
              return <div>User {params.id}</div>;
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
          <Route path="/" component={Loan} />
        </Switch>
      </Container>
    </Box>
  );
}

export default App;

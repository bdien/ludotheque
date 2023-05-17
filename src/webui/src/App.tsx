import Profile from "./components/profile";
import TopBar from "./components/topbar";
import { Box, Container } from "@mui/material";
import { Route, Switch } from "wouter";
import { Loan } from "./pages/loan";
import { ItemList } from "./pages/item_list";
import { CreateUser } from "./pages/create_user";
import { Item } from "./pages/item";

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar />

      <Container maxWidth="md" disableGutters={true}>
        <Switch>
          <Route path="/me">
            <Profile />
          </Route>
          <Route path="/users/new" component={CreateUser} />
          <Route path="/users/:id">
            {(params) => <div>User {params.id}</div>}
          </Route>
          <Route path="/items" component={ItemList} />
          <Route path="/items/:id">
            {(params) => <Item id={parseInt(params.id)} />}
          </Route>
          <Route path="/" component={Loan} />
        </Switch>
      </Container>
    </Box>
  );
}

export default App;

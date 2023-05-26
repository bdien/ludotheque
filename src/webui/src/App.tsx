import { Route, Switch } from "wouter";
import { TopBar } from "./components/topbar";
import { Loan } from "./pages/loan";
import { ItemList } from "./pages/item_list";
import { Item } from "./pages/item_view";
import { ItemEdit } from "./pages/item_edit";
import { UserList } from "./pages/user_list";
import { UserCreate } from "./pages/user_create";
import { UserView } from "./pages/user_view";
import { Box, Container } from "@mui/material";

function App() {
  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <TopBar />

      <Container
        disableGutters={true}
        sx={{ height: "calc(100vh - 130px)", p: 1 }}
      >
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
          <Route path="/" component={Loan} />
        </Switch>
      </Container>
    </Box>
  );
}

export default App;

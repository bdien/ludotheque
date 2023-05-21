import { useState } from "react";
import Profile from "./components/profile";
import TopBar from "./components/topbar";
import { Box, Container } from "@mui/material";
import { Route, Switch } from "wouter";
import { Loan } from "./pages/loan";
import { ItemList } from "./pages/item_list";
import { CreateUser } from "./pages/create_user";
import { Item } from "./pages/item_view";
import { ItemEdit } from "./pages/item_edit";

function App() {
  const [title, setTitle] = useState("Ludothèque");

  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar title={title} />

      <Container maxWidth="md" disableGutters={true}>
        <Switch>
          <Route path="/me">
            {() => {
              setTitle("Mon compte");
              return <Profile />;
            }}
          </Route>
          <Route path="/users/new">
            {() => {
              setTitle("Nouvelle personne");
              return <CreateUser />;
            }}
          </Route>
          <Route path="/users/:id">
            {(params) => {
              setTitle("Utilisateur");
              return <div>User {params.id}</div>;
            }}
          </Route>
          <Route path="/items">
            {() => {
              setTitle("Liste de jeux");
              return <ItemList />;
            }}
          </Route>
          <Route path="/items/:id">
            {(params) => {
              setTitle("Jeu");
              return <Item id={parseInt(params.id)} />;
            }}
          </Route>
          <Route path="/items/:id/edit">
            {(params) => {
              setTitle("Edition");
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

import Profile from './components/profile'
import TopBar from './components/topbar'
import { Box } from '@mui/material'
import { Route, Switch } from "wouter";
import { Loan } from './pages/loan';
import { CreateUser } from './pages/create_user';

function App() {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar/>

      <Switch>
        <Route path="/me"><Profile/></Route>
        <Route path="/users/new" component={CreateUser} />
        <Route path="/users/:id">{(params) => <div>User {params.id}</div>}</Route>
        <Route path="/item/:id">{(params) => <div>Item {params.id}</div>}</Route>
        <Route path="/" component={Loan}></Route>
      </Switch>
    </Box>
  );
}

export default App

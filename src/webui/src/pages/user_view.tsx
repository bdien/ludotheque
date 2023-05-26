import MiniItem from "../components/mini_item";
import { useUser } from "../api/hooks";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import { Typography } from "@mui/material";

interface UserViewProps {
  id: number;
}

/*
function groupBy(x, f) {
  return x.reduce((a, b, i) => ((a[f(b, i, x)] ||= []).push(b), a), {})
}
*/

export function UserView(props: UserViewProps) {
  const { user, isLoading, error } = useUser(props.id);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!user) return <div>Server error...</div>;

  // render data
  return (
    <>
      <Grid
        container
        spacing={0}
        columns={16}
        component={Paper}
        sx={{ m: 0, mt: 1, mb: 2 }}
      >
        <Grid xs={1} textAlign={"center"}>
          <Icon>person</Icon>
        </Grid>
        <Grid>
          <Typography variant="h4">{user.name}</Typography>
          <div>Créé le {user.created_time}</div>
          <div>{user?.loans?.length} Prêts</div>
          <div>Credit sur la carte: {user?.credit}€</div>
        </Grid>
      </Grid>
      <Box component={Paper}></Box>
      {user?.loans?.map((obj) => <MiniItem key={obj.id} id={obj.item} />)}
    </>
  );
}

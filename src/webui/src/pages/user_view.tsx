import MiniItem from "../components/mini_item";
import { useUser } from "../api/hooks";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Fab from "@mui/material/Fab";
import { Link } from "wouter";

interface UserViewProps {
  id: number;
}

export function UserView(props: UserViewProps) {
  const { user, isLoading, error, mutate } = useUser(props.id);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!user) return <div>Server error...</div>;

  function onLoanClose(_obj_id: number): void {
    mutate && mutate();
  }

  // render data
  return (
    <>
      <Grid
        container
        spacing={0}
        columns={16}
        component={Paper}
        sx={{ m: 0, mt: 1, mb: 2, p: 2 }}
      >
        <Grid>
          <Typography variant="h4">{user.name}</Typography>
          {user?.email}
          <div>{user?.loans?.length} Prêts</div>
          {user?.credit > 0 && <div>{user?.credit}€ sur la carte</div>}
        </Grid>
      </Grid>

      <Box display="flex" flexWrap="wrap" width="100%">
        {user?.loans?.map((obj) => (
          <MiniItem key={obj.id} id={obj.item} onLoanClose={onLoanClose} />
        ))}
      </Box>

      {/* Edit button */}
      <Link href={`/users/${user.id}/edit`}>
        <Fab
          color="primary"
          aria-label="edit"
          sx={{
            position: "fixed",
            bottom: (theme) => theme.spacing(2),
            right: (theme) => theme.spacing(2),
          }}
        >
          <Icon>edit</Icon>
        </Fab>
      </Link>
    </>
  );
}

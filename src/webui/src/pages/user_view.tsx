import MiniItem from "../components/mini_item";
import { useUser } from "../api/hooks";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import { Link } from "wouter";
import { MiniUser } from "../components/mini_user";

interface UserViewProps {
  id: number;
}

export function UserView(props: UserViewProps) {
  const { user, isLoading, error } = useUser(props.id);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!user) return <div>Server error...</div>;

  return (
    <>
      <MiniUser fullDetails={true} user={user} />

      <Box display="flex" flexWrap="wrap" width="100%">
        {user?.loans?.map((obj) => <MiniItem key={obj.id} id={obj.item} />)}
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

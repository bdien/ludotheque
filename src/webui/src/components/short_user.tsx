import { Link } from "wouter";
import { useUsers } from "../api/hooks";
import Typography from "@mui/material/Typography";
import { Icon } from "@mui/material";

export function ShortUser({ user_id }: { user_id: number }) {
  const { users } = useUsers();

  const user = users ? users.get(user_id) : null;
  if (!user) return <>Adhérent {user_id}</>;

  return (
    <Link href={`/users/${user.id}`}>
      <Typography
        color="primary"
        component="span"
        sx={{
          cursor: "pointer",
          fontSize: "inherit",
          lineHeight: "inherit",
          fontWeight: "inherit",
        }}
      >
        {user.name}
        {user.role === "admin" && (
          <Icon sx={{ fontSize: "0.9em", ml: 0.1 }}>star</Icon>
        )}
        {user.role === "benevole" && (
          <Icon sx={{ fontSize: "0.9em", ml: 0.1 }}>star_half</Icon>
        )}
      </Typography>
    </Link>
  );
}

import { Link } from "wouter";
import { useUsers } from "../api/hooks";
import Typography from "@mui/material/Typography";
import { Icon } from "@mui/material";

export function ShortUser({ user_id }: { user_id: number }) {
  const { users } = useUsers();

  const user = users ? users.get(user_id) : null;
  if (!user) {
    if (user_id) return <>Adhérent {user_id}</>;
    return <>Ancien adhérent</>;
  }

  return (
    <Link href={`/users/${user.id}`} style={{ textDecoration: "none" }}>
      <Typography
        color="primary"
        component="span"
        sx={{
          cursor: "pointer",
          fontSize: "inherit",
          lineHeight: "inherit",
          fontWeight: "inherit",
          textDecoration: user.enabled ? "" : "line-through",
        }}
      >
        {user.name}
        {user.role === "admin" && (
          <Icon sx={{ fontSize: "1em", ml: 0.1 }}>star</Icon>
        )}
        {user.role === "benevole" && (
          <Icon sx={{ fontSize: "1em", ml: 0.1 }}>star_half</Icon>
        )}
        {!user.enabled && (
          <Icon color="warning" sx={{ fontSize: "1em", ml: 0.5 }}>
            cancel
          </Icon>
        )}
      </Typography>
    </Link>
  );
}

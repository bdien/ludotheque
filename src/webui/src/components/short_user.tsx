import { Link } from "wouter";
import { useUser } from "../api/hooks";
import Typography from "@mui/material/Typography";
import { Icon } from "@mui/material";

export function ShortUser({ user_id }: { user_id: number }) {
  const { user } = useUser(user_id);

  if (!user) return <>Adhérent ${user_id}</>;

  return (
    <Link href={`/users/${user.id}`}>
      <Typography color="primary" sx={{ cursor: "pointer" }}>
        {user.name}
        {user.role === "admin" && (
          <Icon sx={{ fontSize: "0.9em", ml: 0.3 }}>star</Icon>
        )}
      </Typography>
    </Link>
  );
}

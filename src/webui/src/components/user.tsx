import { useUser } from "../api/hooks";

interface UserProps {
  id: number;
}

export function User(props: UserProps) {
  const { user } = useUser(props.id);

  if (!user) return <></>;

  // render data
  return <div>User {user.name}</div>;
}

export default User;

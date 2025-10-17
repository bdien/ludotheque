import { useGlobalStore } from "../hooks/global_store";
import { useLocation } from "wouter";
import { useAuth0 } from "@auth0/auth0-react";

export function UserMyAccount() {
  const { account } = useGlobalStore();
  const { loginWithRedirect } = useAuth0();
  const [_location, setLocation] = useLocation();

  if (!account || account.id === 0) loginWithRedirect();

  setLocation(`/users/${account.id}`);
  return <></>;
}

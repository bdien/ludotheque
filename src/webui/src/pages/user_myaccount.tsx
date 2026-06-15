import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGlobalStore } from "../hooks/global_store";

export function UserMyAccount() {
  const { account } = useGlobalStore();
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [_location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (account && account.id !== 0) {
      setLocation(`/users/${account.id}`);
    }
  }, [account, isAuthenticated, loginWithRedirect, setLocation]);

  return <></>;
}

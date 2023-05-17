import useSWRImmutable from "swr/immutable";
import { Account, ItemModel, UserModel, Users } from "./models";
import { SERVER_URL } from "./calls";

async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);
  return res.json();
}

export function useAccount() {
  const { data, error, isLoading } = useSWRImmutable<Account>(
    `${SERVER_URL}/me`,
    fetcher,
  );

  return {
    account: data,
    isLoading,
    error,
  };
}

export function useItem(id: number) {
  const { data, error, isLoading } = useSWRImmutable<ItemModel>(
    `${SERVER_URL}/items/${id}`,
    fetcher,
  );

  return {
    item: data,
    isLoading,
    error,
  };
}

export function useUser(id: number | null) {
  if (!id) return { user: null, isLoading: false, error: false };

  const { data, error, isLoading } = useSWRImmutable<UserModel>(
    `${SERVER_URL}/users/${id}`,
    fetcher,
  );

  return {
    user: data,
    isLoading,
    error,
  };
}

export function useUsers() {
  const { data, error, isLoading } = useSWRImmutable<Users>(
    `${SERVER_URL}/users`,
    fetcher,
  );

  return {
    users: data,
    isLoading,
    error,
  };
}

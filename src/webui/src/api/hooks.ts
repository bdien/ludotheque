import useSWRImmutable from "swr/immutable";
import useSWR from "swr";
import { Account, ItemModel, UserModel, Users } from "./models";
import { SERVER_URL } from "./calls";

async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);

  if (res.status >= 400)
    throw new Error(await res.text(), { cause: res.status });

  return res.json();
}

export function useAccount() {
  const { data, error, isLoading } = useSWR<Account>(
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
  const { data, error, isLoading, mutate } = useSWR<ItemModel>(
    `${SERVER_URL}/items/${id}`,
    fetcher,
  );

  return {
    item: data,
    isLoading,
    error,
    mutate,
  };
}

export function useItems(filter?: string) {
  let qs = "";
  if (filter) qs = `?q=${filter}`;
  const { data, error, isLoading } = useSWRImmutable<ItemModel[]>(
    `${SERVER_URL}/items${qs}`,
    fetcher,
  );

  return {
    items: data,
    isLoading,
    error,
  };
}

export function useUser(id: number | null) {
  if (!id) return { user: null, isLoading: false, error: false };

  const { data, error, isLoading } = useSWR<UserModel>(
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

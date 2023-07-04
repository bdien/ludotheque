import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import {
  Account,
  InfoModel,
  ItemModel,
  Loan,
  UserModel,
  Users,
} from "./models";
import { SERVER_URL, fetcher } from "./calls";

export function useInfo() {
  const { data, error, isLoading } = useSWRImmutable<InfoModel>(
    `${SERVER_URL}/info`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    info: data,
    isLoading,
    error,
  };
}

export function useAccount() {
  const { data, error, isLoading, mutate } = useSWR<Account>(
    `${SERVER_URL}/users/me`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    account: data,
    isLoading,
    error,
    mutate,
  };
}

const DEFAULT_ITEM: ItemModel = {
  id: 0,
  age: 8,
  big: false,
  description: "",
  name: "",
  outside: false,
  players_max: 4,
  players_min: 1,
};

export function useItem(id?: number) {
  if (!id) {
    return {
      item: DEFAULT_ITEM,
      isLoading: false,
      error: false,
      mutate: undefined,
    };
  }

  const { data, error, isLoading, mutate } = useSWR<ItemModel>(
    `${SERVER_URL}/items/${id}`,
    fetcher,
    { revalidateOnFocus: false },
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
  const { data, error, isLoading } = useSWR<ItemModel[]>(
    `${SERVER_URL}/items${qs}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    items: data,
    isLoading,
    error,
  };
}

interface CategoryDict {
  [id: number]: string;
}

export function useCategories() {
  const { data, error, isLoading } = useSWRImmutable<CategoryDict>(
    `${SERVER_URL}/categories`,
    fetcher,
  );

  return {
    categories: data,
    isLoading,
    error,
  };
}

const DEFAULT_USER: UserModel = {
  id: 0,
  name: "",
  email: "",
  role: "user",
  credit: 0,
};

export function useUser(id?: number) {
  if (!id) {
    return {
      user: { ...DEFAULT_USER },
      isLoading: false,
      error: false,
      mutate: undefined,
    };
  }

  const { data, error, isLoading, mutate } = useSWR<UserModel>(
    `${SERVER_URL}/users/${id}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUsers() {
  const { data, error, isLoading } = useSWR<Users>(
    `${SERVER_URL}/users`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    users: data,
    isLoading,
    error,
  };
}

export function useLoan(id: number) {
  const { data, error, isLoading, mutate } = useSWR<Loan>(
    `${SERVER_URL}/loans/${id}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    loan: data,
    isLoading,
    error,
    mutate,
  };
}

import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import {
  Account,
  InfoModel,
  ItemListEntry,
  ItemModel,
  LedgerEntry,
  Loan,
  UserModel,
  Users,
  Stats,
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

export function useStats() {
  const { data, error, isLoading } = useSWRImmutable<Stats>(
    `${SERVER_URL}/stats`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    stats: data,
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
  categories: [],
  name: "",
  outside: false,
  players_max: 4,
  players_min: 1,
  notes: "",
  enabled: true,
};

export function useItem(id?: number) {
  if (!id) {
    return {
      item: { ...DEFAULT_ITEM },
      isLoading: false,
      error: false,
      mutate: undefined,
    };
  }

  let url = `${SERVER_URL}/items/${id}`;

  const { data, error, isLoading, mutate } = useSWR<ItemModel>(url, fetcher, {
    revalidateOnFocus: false,
  });

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
  const { data, error, isLoading, mutate } = useSWR<ItemListEntry[]>(
    `${SERVER_URL}/items${qs}`,
    fetcher,
    { dedupingInterval: 300000 },
  );

  return {
    items: new Map(data ? data.map((i) => [i["id"], i]) : null),
    isLoading,
    error,
    mutate,
  };
}

interface Category {
  id: number;
  name: string;
}

export function useCategories() {
  const { data, error, isLoading } = useSWRImmutable<Category[]>(
    `${SERVER_URL}/categories`,
    fetcher,
  );

  return {
    categories: new Map(data ? data.map((i) => [i["id"], i["name"]]) : null),
    isLoading,
    error,
  };
}

const DEFAULT_USER: UserModel = {
  id: 0,
  name: "",
  emails: [],
  role: "user",
  credit: 0,
  notes: "",
  enabled: true,
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

  let url = `${SERVER_URL}/users/${id}`;

  const { data, error, isLoading, mutate } = useSWR<UserModel>(url, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUserHistory(id?: number) {
  const { data, error, isLoading, mutate } = useSWR<Loan[]>(
    `${SERVER_URL}/users/${id}/history`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    history: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<Users>(
    `${SERVER_URL}/users`,
    fetcher,
    { dedupingInterval: 300000 },
  );

  return {
    users: new Map(data ? data.map((i) => [i["id"], i]) : null),
    isLoading,
    error,
    mutate,
  };
}

export function useLoansLate(mindays: number = 0) {
  const { data, error, isLoading } = useSWR<Loan[]>(
    `${SERVER_URL}/loans/late?mindays=${mindays}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    loans: data,
    isLoading,
    error,
  };
}

export function useLoans() {
  const { data, error, isLoading } = useSWR<Loan[]>(
    `${SERVER_URL}/loans`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    loans: data,
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

export function useLedger() {
  const { data, error, isLoading } = useSWR<LedgerEntry[]>(
    `${SERVER_URL}/ledger`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    ledger: data,
    isLoading,
    error,
  };
}

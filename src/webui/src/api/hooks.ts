import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import {
  Info,
  ItemListEntry,
  ItemModel,
  LedgerEntry,
  Loan,
  User,
  Users,
  Stats,
} from "./models";
import { SERVER_URL, fetcher } from "./calls";

export function useInfo() {
  const { data, error, isLoading } = useSWRImmutable<Info>(
    `${SERVER_URL}/info`,
    fetcher,
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
  );

  return {
    stats: data,
    isLoading,
    error,
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

  const url = `${SERVER_URL}/items/${id}`;

  const { data, error, isLoading, mutate } = useSWR<ItemModel>(url, fetcher, {
    dedupingInterval: 30000,
  });

  return {
    item: data,
    isLoading,
    error,
    mutate,
  };
}

interface useItemsProps {
  q?: string;
  sort?: string;
  nb?: number;
}

export function useItems(props?: useItemsProps) {
  let qs = "?";
  if (props?.q) qs += `q=${props.q}&`;
  if (props?.sort) qs += `sort=${props.sort}&`;
  if (props?.nb) qs += `nb=${props.nb}&`;

  const { data, error, isLoading, mutate } = useSWR<ItemListEntry[]>(
    `${SERVER_URL}/items${qs}`,
    fetcher,
    { dedupingInterval: 60000 },
  );

  return {
    items: new Map(data ? data.map((i) => [i["id"], i]) : null),
    isLoading,
    error,
    mutate,
  };
}

interface useItemsLastseenProps {
  days?: number;
}

interface ItemLastseenEntry {
  id: number;
  lastseen: string;
}

export function useItemsLastseen(props?: useItemsLastseenProps) {
  let qs = "?";
  if (props?.days) qs += `days=${props.days}`;

  const { data, error, isLoading, mutate } = useSWR<ItemLastseenEntry[]>(
    `${SERVER_URL}/items/lastseen${qs}`,
    fetcher,
    { dedupingInterval: 60000 },
  );

  return {
    items: data,
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
    categories: data && new Map(data.map((i) => [i["id"], i["name"]])),
    isLoading,
    error,
  };
}

const DEFAULT_USER: User = {
  id: 0,
  name: "",
  emails: [],
  favorites: [],
  bookings: [],
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

  const url = `${SERVER_URL}/users/${id}`;

  const { data, error, isLoading, mutate } = useSWR<User>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
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
      dedupingInterval: 60000,
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
    { dedupingInterval: 60000 },
  );

  return {
    users: data && new Map(data.map((i) => [i["id"], i])),
    isLoading,
    error,
    mutate,
  };
}

export function useLoansLate(mindays = 0) {
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

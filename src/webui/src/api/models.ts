export interface Info {
  nbitems: number;
  domain: string;
  version: string;
  next_opening: string;
  pricing: {
    regular: number;
    big: number;
    big_associations: number;
    yearly: number;
    card: number;
  };
  loan: {
    maxitems: number;
    weeks: number;
  };
  booking: {
    maxitems: number;
    weeks: number;
  };
  image_max: number;
  email_minperiod: number;
  email_minlate: number;
}

export interface Booking {
  user: number;
  item: number;
  created_at: string;
  start: string;
}

export interface User {
  id: number;
  name: string;
  enabled: boolean;
  emails: string[];
  favorites: number[];
  role: string;
  credit: number;
  oldest_loan?: string;
  loans?: Loan[];
  bookings: Booking[];
  nbloans?: number;
  notes?: string;
  informations?: string;
  subscription?: string;
  apikey?: string;
  created_at?: string;
  last_warning?: string;
}

export type Users = User[];

export interface ItemLinkModel {
  name: string;
  ref: string;
  extra?: Record<string, any>;
}

export interface ItemListEntry {
  id: number;
  name: string;
  enabled: boolean;
  players_max: number;
  players_min: number;
  age: number;
  big: boolean;
  outside: boolean;
  status: string;
  created_at: string;
}

export interface ItemModel {
  id: number;
  name: string;
  enabled?: boolean;
  description?: string;
  pictures?: string[];
  players_max?: number;
  players_min?: number;
  gametime?: number;
  age?: number;
  big?: boolean;
  outside?: boolean;
  content?: string[];
  notes?: string;
  categories?: number[];
  links?: ItemLinkModel[];
  created_at?: string;
  lastseen?: string;
  loanstop?: string;
  status?: string;
  return?: string;
  loans?: Loan[];
  bookings?: {
    nb: number;
    entries?: Booking[];
  };
}

export interface Loan {
  id: number;
  item: number;
  start: string;
  stop: string;
  status: string;
  user: number;
}

export interface Account {
  id: number;
  role: string;
}

export interface LoanCreateResult {
  cost: number;
  items_cost: number[];
  topay: {
    credit: number;
    real: number;
  };
  new_credit: number;
  loans: Loan[];
}

export interface ApiError {
  detail: string;
}

export interface LedgerEntry {
  operator_id: number;
  user: number;
  loan_id?: number;
  item_id: number;
  cost: number;
  money: number;
  day: string;
  created_at: string;
}

export interface EMail {
  to: string[];
  body: string;
  title: string;
  sent: boolean;
  error?: string;
}

export type Stats = Record<
  string,
  {
    items: {
      totalin: number;
      totalout: number;
      in: number;
      out: number;
    };
    users: {
      month: number;
      day: number;
    };
  }
>;

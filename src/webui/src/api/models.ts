export interface InfoModel {
  nbitems: number;
  domain: string;
  version: string;
  pricing: {
    regular: number;
    big: number;
    big_associations: number;
    yearly: number;
    card: number;
  };
  loan: {
    days: number;
  };
}

export interface UserModel {
  id: number;
  name: string;
  enabled: boolean;
  emails?: string[];
  role: string;
  credit: number;
  oldest_loan?: string;
  loans?: Loan[];
  nbloans?: number;
  notes?: string;
  informations?: string;
  created_at?: string;
  subscription?: string;
  apikey?: string;
}

export type Users = Array<UserModel>;

export interface ItemLinkModel {
  name: string;
  ref: string;
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
  status?: string;
  return?: string;
  loans?: Loan[];
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
  user_id: number;
  loan_id?: number;
  item_id: number;
  cost: number;
  money: number;
  day: string;
  created_at: string;
}

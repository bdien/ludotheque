export interface InfoModel {
  nbitems: number;
  domain: string;
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
  email?: string;
  role: string;
  credit: number;
  oldest_loan?: string;
  loans?: Loan[];
  nbloans?: number;
  notes?: string;
  created_at?: string;
  subscription?: string;
  apikey?: string;
}

export interface Users extends Array<UserModel> {}

export interface ItemLinkModel {
  name: string;
  ref: string;
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
  user?: {
    id: number;
    name: string;
  };
}

export interface Account {
  name: string;
  email?: string;
  role: string;
  id: number;
  loans?: Loan[];
}

export interface LoanCreateResult {
  cost: number;
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

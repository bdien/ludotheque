export interface UserModel {
  id: number;
  name: string;
  email?: string;
  role: string;
  credit: number;
}

export interface UsersItem {
  id: number;
  name: string;
}

export interface Users extends Array<UsersItem> { }

export interface Item {
  id: number;
  name: string;
  picture?: string;
  description?: string;
}

export interface Loan {
  id: number;
  item: number;
  user: number;
  start: string;
  stop: string;
  status: string;
}

export interface Account {
  name: string;
  email?: string;
  role: string;
  id: number;
  loans?: Loan[];
}

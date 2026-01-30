import {
  User,
  ItemModel,
  LoanCreateResult,
  ApiError,
  EMail,
  Account,
} from "./models";
export const SERVER_URL = "/api";

let access_token: string | null = null;

export function setToken(token: string) {
  access_token = token;
}

export async function fetcher(url: string): Promise<any> {
  let options = {};
  if (access_token)
    options = { headers: { authorization: `bearer ${access_token}` } };

  const res = await fetch(url, options);

  if (res.status >= 400)
    throw new Error(await res.text(), { cause: res.status });

  return res.json();
}

function fetchWithToken(url: string, params: object = {}) {
  if (access_token)
    params = {
      ...params,
      headers: { authorization: `bearer ${access_token}` },
    };
  return fetch(url, params);
}

// Item
// -------------------

export async function exportItems(): Promise<string> {
  const response = await fetchWithToken(`${SERVER_URL}/items/export`);
  return response.text();
}

export async function searchItem(txt: string): Promise<ItemModel[]> {
  if (!txt) return Promise.resolve([]);
  const response = await fetchWithToken(
    encodeURI(`${SERVER_URL}/items/search?q=${txt}`),
  );
  return response.json();
}

export async function fetchItem(itemId: number): Promise<ItemModel> {
  const response = await fetchWithToken(`${SERVER_URL}/items/${itemId}`);
  return response.json();
}

export async function updateItem(
  itemId: number,
  obj: object,
): Promise<ItemModel> {
  const response = await fetchWithToken(`${SERVER_URL}/items/${itemId}`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

export async function createItem(obj: object): Promise<ItemModel | ApiError> {
  const response = await fetchWithToken(`${SERVER_URL}/items`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

export async function deleteItem(itemId: number) {
  await fetchWithToken(`${SERVER_URL}/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function bookitem(itemId: number) {
  await fetchWithToken(`${SERVER_URL}/bookings`, {
    method: "POST",
    body: JSON.stringify({ item: itemId }),
  });
}

export async function unbook(bookingId: number) {
  await fetchWithToken(`${SERVER_URL}/bookings/${bookingId}`, {
    method: "DELETE",
  });
}

// Loan
// -------------------

export async function createLoan(
  user: number,
  items: number[],
  simulation: boolean,
): Promise<LoanCreateResult> {
  const response = await fetchWithToken(`${SERVER_URL}/loans`, {
    method: "POST",
    body: JSON.stringify({ user, items, simulation }),
  });
  return response.json();
}

export async function closeLoan(loanId: number): Promise<ItemModel> {
  const response = await fetchWithToken(`${SERVER_URL}/loans/${loanId}/close`, {
    method: "POST",
  });
  return response.json();
}

// User
// -------------------

export async function getAccount(): Promise<Account> {
  const response = await fetchWithToken(`${SERVER_URL}/users/me`);
  return response.json();
}

export async function exportUsers(): Promise<string> {
  const response = await fetchWithToken(`${SERVER_URL}/users/export`);
  return response.text();
}

export async function fetchUser(userId: number): Promise<User> {
  const response = await fetchWithToken(`${SERVER_URL}/users/${userId}`);
  return response.json();
}

export async function searchUser(txt: string): Promise<User[]> {
  if (!txt) return Promise.resolve([]);
  const response = await fetchWithToken(
    encodeURI(`${SERVER_URL}/users/search?q=${txt}`),
  );
  return response.json();
}

export async function createUser(obj: object): Promise<User | ApiError> {
  const response = await fetchWithToken(`${SERVER_URL}/users`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

export async function deleteUser(userId: number) {
  const response = await fetchWithToken(`${SERVER_URL}/users/${userId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function updateUser(userId: number, obj: object): Promise<User> {
  const response = await fetchWithToken(`${SERVER_URL}/users/${userId}`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

export async function emailUser(userId: number, send = false): Promise<EMail> {
  const response = await fetchWithToken(
    `${SERVER_URL}/users/${userId}/email${send ? "?send=1" : ""}`,
    {
      method: "POST",
    },
  );
  return response.json();
}

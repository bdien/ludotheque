import { UserModel, ItemModel, LoanCreateResult } from "./models";
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

function fetchWithToken(url: string, params: any = {}) {
  if (access_token)
    params = {
      ...params,
      headers: { authorization: `bearer ${access_token}` },
    };
  return fetch(url, params);
}

export async function qsearchItem(txt: string): Promise<ItemModel[]> {
  if (!txt || txt.length < 1) return Promise.resolve([]);
  const response = await fetchWithToken(`${SERVER_URL}/items/qsearch/${txt}`);
  return response.json();
}

export async function fetchItem(itemId: number): Promise<ItemModel> {
  const response = await fetchWithToken(`${SERVER_URL}/items/${itemId}`);
  return response.json();
}

export async function updateItem(
  itemId: number,
  obj: Object,
): Promise<ItemModel> {
  const response = await fetchWithToken(`${SERVER_URL}/items/${itemId}`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

export async function createItem(obj: Object): Promise<ItemModel> {
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

export async function deleteItemPicture(itemId: number, pictureIdx: number) {
  await fetchWithToken(`${SERVER_URL}/items/${itemId}/picture/${pictureIdx}`, {
    method: "DELETE",
  });
}

export async function updateItemPicture(
  itemId: number,
  pictureIdx: number,
  file: File,
) {
  var data = new FormData();
  data.append("file", file);

  await fetchWithToken(`${SERVER_URL}/items/${itemId}/picture/${pictureIdx}`, {
    method: "POST",
    body: data,
  });
}

// Loan
// -------------------

export async function createLoan(
  user: number,
  items: number[],
  benevole: boolean,
  simulation: boolean,
): Promise<LoanCreateResult> {
  const response = await fetchWithToken(`${SERVER_URL}/loans`, {
    method: "POST",
    body: JSON.stringify({ user, items, benevole, simulation }),
  });
  return response.json();
}

export async function closeLoan(loanId: number): Promise<ItemModel> {
  const response = await fetchWithToken(`${SERVER_URL}/loans/${loanId}/close`);
  return response.json();
}

// User
// -------------------

export async function fetchUser(userId: number): Promise<UserModel> {
  const response = await fetchWithToken(`${SERVER_URL}/users/${userId}`);
  return response.json();
}

export async function qsearchUser(txt: string): Promise<UserModel[]> {
  if (!txt || txt.length < 2) return Promise.resolve([]);
  const response = await fetchWithToken(`${SERVER_URL}/users/qsearch/${txt}`);
  return response.json();
}

export async function createUser(obj: Object): Promise<UserModel> {
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

export async function updateUser(
  userId: number,
  obj: Object,
): Promise<UserModel> {
  const response = await fetchWithToken(`${SERVER_URL}/users/${userId}`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

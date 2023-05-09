import useSWRImmutable from 'swr/immutable';
import { Account } from "../models/account";
import { Item } from "../models/item";

async function fetcher<JSON = any>(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<JSON> {
    const res = await fetch(input, init)
    return res.json()
}

export function useAccount() {
    const { data, error, isLoading } = useSWRImmutable<Account>(
        'http://localhost:8000/me',
        fetcher);

    return {
        account: data,
        isLoading,
        error
    }
}

export function useItem(id: number) {
    const { data, error, isLoading } = useSWRImmutable<Item>(
        `http://localhost:8000/items/${id}`,
        fetcher);

    return {
        item: data,
        isLoading,
        error
    }
}
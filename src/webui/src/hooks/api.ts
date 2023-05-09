import useSWRImmutable from 'swr/immutable';
import { Account } from "../models/account";

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

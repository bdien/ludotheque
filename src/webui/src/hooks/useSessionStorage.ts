/** From: https://github.com/streamich/react-use/blob/master/src/useSessionStorage.ts
 * License: The Unlicense **/

import { useEffect, useState } from "react";

const useSessionStorage = <T>(
  key: string,
  initialValue?: T,
  raw?: boolean,
): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(() => {
    try {
      const sessionStorageValue = sessionStorage.getItem(key);
      if (typeof sessionStorageValue !== "string") {
        sessionStorage.setItem(
          key,
          raw ? String(initialValue) : JSON.stringify(initialValue),
        );
        return initialValue;
      } else {
        return raw
          ? sessionStorageValue
          : JSON.parse(sessionStorageValue || "null");
      }
    } catch {
      // If user is in private mode or has storage restriction
      // sessionStorage can throw. JSON.parse and JSON.stringify
      // can throw, too.
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const serializedState = raw ? String(state) : JSON.stringify(state);
      sessionStorage.setItem(key, serializedState);
    } catch {
      // If user is in private mode or has storage restriction
      // sessionStorage can throw. Also JSON.stringify can throw.
    }
  });

  return [state, setState];
};

export default useSessionStorage;

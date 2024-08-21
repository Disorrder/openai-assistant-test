import { useEffect, useState } from "react";

/** @deprecated - just trying to fix persisted store, but seems like there's the same hook in zustand already */
export function useStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
) {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
}

export function useStoreReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("localStorage" in window) {
      setReady(true);
    }
  }, []);

  return ready;
}

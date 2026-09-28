import { useCallback, useState } from "react";

type Toggleable = { id: string; enabled: boolean };

/** Estado on/off indexado por id, inicializado desde una lista de opciones. */
export function useToggleRecord(options: readonly Toggleable[]) {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(options.map((option) => [option.id, option.enabled])),
  );

  const setValue = useCallback((id: string, enabled: boolean) => {
    setValues((previous) => ({ ...previous, [id]: enabled }));
  }, []);

  return [values, setValue] as const;
}

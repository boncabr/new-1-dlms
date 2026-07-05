/* ============================================================================
 * DLMS LOSS — React hook binding components to the player controller.
 * Forces a re-render on every player event so the UI stays in sync without
 * polling timers.
 * ========================================================================== */
import { useEffect, useReducer } from "react";
import { player } from "./PlayerController";

export function usePlayer() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const unsub = player.subscribe(force);
    return () => { unsub(); };
  }, []);
  return player;
}

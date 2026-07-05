/* ============================================================================
 * DLMS LOSS — Test tone trigger
 * Lets users drive the analyser/meters even before loading a song. The tone
 * flows through the full DSP chain, so it is also a handy bypass check.
 * ========================================================================== */
import { useState } from "react";
import { Radio } from "lucide-react";
import { engine } from "../../audio/DspEngine";
import { IconButton } from "./primitives";
import { useUiStore } from "../../store/useUiStore";

export function TestTone() {
  const [on, setOn] = useState(engine.isToneOn());
  const pushToast = useUiStore((s) => s.pushToast);
  const toggle = async () => {
    if (on) { engine.stopTone(); setOn(false); return; }
    await engine.init(engine.latencyHint);
    await engine.resume();
    engine.startTone("sawtooth", 180);
    setOn(true);
    pushToast("Test tone running — adjust the DSP and watch it move", "info");
  };
  return <IconButton active={on} onClick={toggle} title="Toggle test tone"><Radio size={16} /></IconButton>;
}

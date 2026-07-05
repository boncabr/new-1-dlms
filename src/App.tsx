/* ============================================================================
 * DLMS LOSS — Application root
 * Gates on the splash screen (which initialises the audio engine on a user
 * gesture), then renders the rack shell + active screen.
 *
 * DLMS LOSS — Digital Loudspeaker Management System
 * Created by Mas Ari
 * ========================================================================== */
import { useEffect } from "react";
import { useUiStore } from "./store/useUiStore";
import { TopBar, BottomNav, Toaster } from "./components/layout/Shell";

import SplashScreen from "./pages/SplashScreen";
import HomePage from "./pages/HomePage";
import PlayerPage from "./pages/PlayerPage";
import DspPage from "./pages/DspPage";
import EqualizerPage from "./pages/EqualizerPage";
import CompressorPage from "./pages/CompressorPage";
import LimiterPage from "./pages/LimiterPage";
import DelayPage from "./pages/DelayPage";
import CrossoverPage from "./pages/CrossoverPage";
import SpectrumPage from "./pages/SpectrumPage";
import VuMeterPage from "./pages/VuMeterPage";
import PresetPage from "./pages/PresetPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import type { ScreenId } from "./audio/types";

/** Resolve a screen id to its page component. */
function renderScreen(screen: ScreenId) {
  switch (screen) {
    case "home": return <HomePage />;
    case "player": return <PlayerPage />;
    case "dsp": return <DspPage />;
    case "equalizer": return <EqualizerPage />;
    case "compressor": return <CompressorPage />;
    case "limiter": return <LimiterPage />;
    case "delay": return <DelayPage />;
    case "crossover": return <CrossoverPage />;
    case "spectrum": return <SpectrumPage />;
    case "vumeter": return <VuMeterPage />;
    case "preset": return <PresetPage />;
    case "settings": return <SettingsPage />;
    case "about": return <AboutPage />;
    default: return <HomePage />;
  }
}

export default function App() {
  const { screen, splashDone, applyTheme } = useUiStore();

  // Keep the live theme in sync (also re-applies on mount).
  useEffect(() => { applyTheme(); }, [applyTheme]);

  if (!splashDone) return <SplashScreen />;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <TopBar />
      <div key={screen} className="animate-fade-in flex min-h-0 flex-1 flex-col">
        {renderScreen(screen)}
      </div>
      <BottomNav />
      <Toaster />
    </div>
  );
}

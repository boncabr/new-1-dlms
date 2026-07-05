import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import Console from "./sections/Console";
import Modules from "./sections/Modules";
import Crossover from "./sections/Crossover";
import Presets from "./sections/Presets";
import Platform from "./sections/Platform";
import About from "./sections/About";

/**
 * DLMS LOSS — interactive product showcase.
 * A portfolio-grade single page featuring a live, in-browser DSP console
 * (Web Audio) that mirrors the native Android engine, plus honest platform docs.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-rack-950 text-slate-100">
      <Nav />
      <main>
        <Hero />
        <Console />
        <Modules />
        <Crossover />
        <Presets />
        <Platform />
        <About />
      </main>
    </div>
  );
}

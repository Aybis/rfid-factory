import { useEffect } from 'react';
import Scene3DContainer from './components/Scene3DContainer';
import Nav from './components/Nav';
import ProgressDots from './components/ProgressDots';
import Hero from './components/Hero';
import Immersive from './components/Immersive';
import Services from './components/Services';
import Specs from './components/Specs';
import CtaSection from './components/CtaSection';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { initScrollEngine } from './lib/scrollEngine';
import { initScene3D } from './lib/scene3d';
import { initPins } from './lib/pins';

export default function App() {
  useEffect(() => {
    // The DOM rendered by React is now mounted, so the imperative behavior
    // modules can safely query the same ids/classes the original scripts used.
    // Order matters: scene3d must register window.rfidScene before pins runs.
    const disposeScroll = initScrollEngine();
    const disposeScene = initScene3D();
    const disposePins = initPins();

    return () => {
      disposePins();
      disposeScene();
      disposeScroll();
    };
  }, []);

  return (
    <>
      <Scene3DContainer />
      <Nav />
      <ProgressDots />
      <Hero />
      <Immersive />
      <Services />
      <Specs />
      <CtaSection />
      <Contact />
      <Footer />
    </>
  );
}

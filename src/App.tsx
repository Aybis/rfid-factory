import { useEffect } from 'react';
import Scene3DContainer from './components/Scene3DContainer';
import Nav from './components/Nav';
import ProgressDots from './components/ProgressDots';
import Hero from './components/Hero';
import WarehouseView from './components/WarehouseView';
import Immersive from './components/Immersive';
import Services from './components/Services';
import Specs from './components/Specs';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import { initScrollEngine } from './lib/scrollEngine';
import { initOverlay } from './lib/overlay';
import { initScene3D } from './lib/scene3d';

export default function App() {
  useEffect(() => {
    // The DOM rendered by React is now mounted, so the imperative engines can
    // safely query the same ids/classes. Order matters: the overlay must be
    // ready before the scene's animation loop starts driving it.
    const disposeScroll = initScrollEngine();
    const disposeOverlay = initOverlay();
    const disposeScene = initScene3D();

    return () => {
      disposeScene();
      disposeOverlay();
      disposeScroll();
    };
  }, []);

  return (
    <>
      <Scene3DContainer />
      <Nav />
      <ProgressDots />
      <Hero />
      <WarehouseView />
      <Immersive />
      <Services />
      <Specs />
      <CtaSection />
      <Footer />
    </>
  );
}

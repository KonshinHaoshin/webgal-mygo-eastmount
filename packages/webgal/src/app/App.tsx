import { useEffect } from 'react';
import { initializeScript } from '@/Core/initializeScript';
import { Stage } from '@/Stage/Stage';
import {
  BottomControlPanel,
  BottomControlPanelFilm,
  Backlog,
  Title,
  Logo,
  Extra,
  Menu,
  GlobalDialog,
  PanicOverlay,
  DevPanel,
} from '@/UI';
import './modern-css-reset.css';
import './index.scss';
import './animation.scss';

function App() {
  useEffect(() => {
    initializeScript();
  }, []);

  // Provider用于对各组件提供状态
  return (
    <div className="App">
      <Stage />
      <BottomControlPanel />
      <BottomControlPanelFilm />
      <Backlog />
      <Title />
      <Logo />
      <Extra />
      <Menu />
      <GlobalDialog />
      <PanicOverlay />
      <DevPanel />
    </div>
  );
}

export default App;

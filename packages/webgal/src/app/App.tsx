import { useEffect } from 'react';
import { initializeScript } from '@/Core/initializeScript';
import { Stage } from '@/Stage/Stage';
import {
  Translation,
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

export default function App() {
  useEffect(() => {
    initializeScript();
  }, []);

  // Provider用于对各组件提供状态
  return (
    <div className="App">
      <Stage />
      <Translation />
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

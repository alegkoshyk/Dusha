import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import App from "./App";
import "./index.css";

async function initializeNativeApp() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      await SplashScreen.hide();
    } catch (error) {
      console.log('Native initialization skipped:', error);
    }
  }
}

initializeNativeApp();

createRoot(document.getElementById("root")!).render(<App />);

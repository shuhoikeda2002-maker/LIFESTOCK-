import { useState, useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StartScreen } from './components/StartScreen';
import { RulesScreen } from './components/RulesScreen';
import { GameSetup } from './components/GameSetup';
import { GamePlay } from './components/GamePlay';
import { Toaster } from 'sonner';
import { GameProvider } from './contexts/GameContext';

export default function App() {
  return (
    <GameProvider>
      <AppInner />
      <Toaster position="top-center" />
    </GameProvider>
  );
}

function AppInner() {
  const [appState, setAppState] = useState<'start' | 'rules' | 'setup' | 'playing'>('start');

  useEffect(() => {
    // Attempt to lock orientation to landscape for mobile devices
    const lockOrientation = async () => {
      try {
        // Only attempt if Capacitor is available
        if (typeof window !== 'undefined' && (window as any).Capacitor && ScreenOrientation) {
          await ScreenOrientation.lock({ orientation: 'landscape' });
        }
      } catch (err) {
        console.log('Orientation lock skipped:', err);
      }
    };
    lockOrientation();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center overflow-hidden select-none">
      {/* Game Container: 812x375 fixed aspect, scaled to fit screen */}
      <div className="w-full h-full max-w-[812px] max-h-[375px] aspect-[812/375] bg-white text-slate-900 relative overflow-hidden shadow-2xl md:rounded-[32px] flex flex-col transition-all duration-300">
        {appState === 'start' && (
          <StartScreen 
            onStart={() => setAppState('setup')}
            onShowRules={() => setAppState('rules')}
          />
        )}
        {appState === 'rules' && (
          <RulesScreen onClose={() => setAppState('start')} />
        )}
        {appState === 'setup' && (
          <GameSetup 
            onStart={() => setAppState('playing')} 
            onBack={() => setAppState('start')}
          />
        )}
        {appState === 'playing' && (
          <GamePlay />
        )}
      </div>
    </div>
  );
}

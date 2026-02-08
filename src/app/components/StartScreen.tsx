import { Button } from './ui/button';
import { TrendingUp, Play, HelpCircle, Users, Globe } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

interface StartScreenProps {
  onStart: () => void;
  onShowRules: () => void;
}

export function StartScreen({ onStart, onShowRules }: StartScreenProps) {
  const { setGameMode } = useGame();

  const handleLocalStart = () => {
    setGameMode('local');
    onStart();
  };

  const handleOnlineStart = () => {
    setGameMode('online');
    onStart();
  };

  return (
    <div className="h-full w-full bg-white text-slate-900 overflow-hidden relative p-4 flex flex-col items-center justify-center">
      {/* Background Glows (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-50 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-10 text-blue-600" />
            <h1 className="text-5xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              LIFE STOCK
            </h1>
          </div>
          <p className="text-sm font-bold text-slate-400 tracking-[0.3em] uppercase opacity-80">
            人生の波を読み解く投資ゲーム
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2 w-[320px]">
          <Button 
            onClick={handleLocalStart}
            className="bg-blue-600 text-white hover:bg-blue-700 font-black text-lg h-14 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Users className="size-5" />
            1台で遊ぶ (オフライン)
          </Button>

          <Button 
            onClick={handleOnlineStart}
            className="bg-indigo-600 text-white hover:bg-indigo-700 font-black text-lg h-14 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Globe className="size-5" />
            みんなで遊ぶ (オンライン)
          </Button>
          
          <Button 
            onClick={onShowRules}
            variant="outline"
            className="bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-sm h-12 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
          >
            <HelpCircle className="size-4 mr-2" />
            遊び方
          </Button>
        </div>
      </div>
    </div>
  );
}

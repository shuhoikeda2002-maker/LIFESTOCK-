import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Clock, MessageCircle } from 'lucide-react';

const QUESTION_TIME = 180; 

export function QuestionPhase() {
  const { players, getCurrentRound, updateRound, setPhase, gameMode, isHost, playerId, currentCompanyName, isCompany } = useGame();
  const round = getCurrentRound();
  const [timeRemaining, setTimeRemaining] = useState(round?.timerValue ?? QUESTION_TIME);
  const [isActive, setIsActive] = useState(false);

  const company = players.find(p => p.id === round?.companyId);
  const investors = players.filter(p => p.id !== round?.companyId);
  const canControl = gameMode === 'local' || isHost;
  
  // isCompany はコンテキストから取得済み

  useEffect(() => {
    if (gameMode === 'online' && !isHost && round?.timerValue !== undefined) {
      setTimeRemaining(round.timerValue);
      if (round.timerValue < QUESTION_TIME) setIsActive(true);
    }
  }, [round?.timerValue, gameMode, isHost]);

  useEffect(() => {
    if (!isActive || !canControl) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, canControl]);

  useEffect(() => {
    if (gameMode === 'online' && isHost && round && isActive) {
      updateRound(round.roundNumber, { timerValue: timeRemaining });
    }
  }, [timeRemaining, gameMode, isHost, round?.roundNumber, isActive]);

  const startTimer = () => {
    setIsActive(true);
    if (gameMode === 'online' && isHost && round) {
      updateRound(round.roundNumber, { timerValue: QUESTION_TIME });
    }
  };
  
  const handleFinishQuestions = () => {
    if (gameMode === 'online') {
      if (isHost) {
        setPhase('investment');
      }
    } else {
      setPhase('investment');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((QUESTION_TIME - timeRemaining) / QUESTION_TIME) * 100;

  return (
    <div className="h-full w-full bg-white text-slate-900 p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-blue-600">
            質問タイム
          </h2>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            カンパニー: <span className="font-bold" style={{ color: company?.color || '#000' }}>{currentCompanyName || company?.name}</span> さん
          </p>
        </div>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-200">
          お題: <span className="text-blue-600">{round?.topic}</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 items-center justify-center">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className={`relative w-40 h-40 rounded-full border-2 flex items-center justify-center bg-slate-50 transition-all duration-300 ${
            timeRemaining < 30 && isActive ? 'border-red-500' : 'border-blue-500/20'
          }`}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="76" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="4" />
              <circle
                cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="4"
                strokeDasharray={477} strokeDashoffset={477 - (477 * progress) / 100}
                className={`transition-all duration-1000 ${timeRemaining < 30 && isActive ? 'text-red-500' : 'text-blue-600'}`}
              />
            </svg>
            <div className={`text-5xl font-black tabular-nums relative z-10 ${timeRemaining < 30 && isActive ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {canControl ? (
            !isActive ? (
              <Button
                className="w-full max-w-[200px] h-10 bg-blue-600 text-white hover:bg-blue-700 font-black text-sm rounded-xl shadow-lg"
                onClick={startTimer}
              >
                <MessageCircle className="size-4 mr-2" />
                タイマー開始
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full max-w-[200px] h-10 border-slate-200 hover:bg-slate-100 text-slate-600 font-black text-sm rounded-xl"
                onClick={handleFinishQuestions}
              >
                質問を終了する
              </Button>
            )
          ) : (
            <div className="text-center py-4 text-slate-400 font-bold text-sm">
              {isActive ? '質問タイム中...' : 'ホストの開始待ち...'}
            </div>
          )}
        </div>

        <div className="w-[280px] flex flex-col gap-3">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h4 className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-widest opacity-50">カンパニー</h4>
            <div className="text-xl font-black truncate text-slate-900">{company?.name || '---'}</div>
            <div className="text-[10px] text-slate-400 mt-1">グラフについて質問しましょう！</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-1 flex flex-col min-h-0">
            <h4 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest opacity-50">投資家</h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-1.5">
                {investors.map(investor => (
                  <div key={investor.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ color: investor.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: investor.color }}></div>
                    {investor.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

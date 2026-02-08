import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Eye, TrendingUp } from 'lucide-react';
import { formatPoints } from '../utils/formatPoints';

export function ResultsRevealPhase() {
  const { setPhase, getCurrentRound, players, gameMode, isHost, currentCompanyName } = useGame();
  const round = getCurrentRound();
  const company = players.find(p => p.id === round?.companyId);
  const canControl = gameMode === 'local' || isHost;

  const handleResultsTransition = () => {
    if (gameMode === 'online') {
      if (isHost) {
        setPhase('results');
      }
    } else {
      setPhase('results');
    }
  };

  return (
    <div className="h-full w-full bg-white text-slate-900 p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 left-6 z-20">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest">
          カンパニー: <span className="font-bold" style={{ color: company?.color || '#000' }}>{currentCompanyName || company?.name}</span> さん
        </p>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-50 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl">
        <div className="text-center">
          <div className="inline-block bg-slate-50 px-6 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xl font-black text-blue-600">
              {round?.topic}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">投資完了</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl w-full flex items-center gap-6 shadow-xl">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex-shrink-0">
            <Eye className="size-8" />
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="text-lg font-black mb-1 text-slate-900">準備はいいですか？</h3>
            <p className="text-[11px] text-slate-500 leading-tight">
              カンパニー {company?.name} さんの人生グラフを公開し、投資結果を発表します。
            </p>
          </div>

          {canControl ? (
            <Button
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white text-base font-black rounded-xl shadow-lg transition-all active:scale-95"
              onClick={handleResultsTransition}
            >
              公開する
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4">
              <div className="size-5 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
              <div className="text-[10px] font-bold text-slate-400">待機中</div>
            </div>
          )}
        </div>

        {/* スコア表示（最重要：結果発表画面でも累積スコアを表示） */}
        <div className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-3 text-slate-400" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">現在の総資産</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map(player => (
              <div key={player.id} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: player.color }} />
                <div className="text-[10px] font-bold text-slate-700">{player.name}</div>
                <div className="text-[10px] font-black text-blue-600">{formatPoints(player.currentPoint)} pt</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

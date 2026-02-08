import { useGame } from '../contexts/GameContext';
import { formatPoints } from '../utils/formatPoints';

export function GameHeader() {
  const { players, currentRound, phase, gameMode, roomId } = useGame();

  // フェーズに基づいたタイトルを決定
  const getPhaseTitle = () => {
    switch (phase) {
      case 'topic-selection': return 'お題選択';
      case 'graph-creation': return 'グラフ作成';
      case 'questions': return '質問タイム';
      case 'investment': return '投資判断';
      case 'results-reveal': return '結果発表';
      case 'results': return 'ラウンド結果';
      case 'round-summary': return '詳細結果';
      case 'final-results': return '最終結果';
      default: return 'ライフストック';
    }
  };

  return (
    <div className="h-10 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0 z-50">
      <div className="flex items-center gap-3 min-w-[150px]">
        <h1 className="text-sm font-black tracking-tighter text-blue-600">
          LIFE STOCK
        </h1>
        <div className="h-3 w-px bg-slate-200"></div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          R {currentRound} / {players.length}
        </div>
        {gameMode === 'online' && (
          <>
            <div className="h-3 w-px bg-slate-200"></div>
            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              ID: {roomId}
            </div>
          </>
        )}
      </div>

      <div className="text-[10px] font-black text-slate-500 tracking-[0.2em]">
        {getPhaseTitle()}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[40%]">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0">
            <div 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: player.color }}
            />
            <div className="text-[9px] font-bold text-slate-700 whitespace-nowrap">
              {formatPoints(player.currentPoint)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

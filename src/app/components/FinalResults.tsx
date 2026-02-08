import { useGame } from '../contexts/GameContext';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { formatPoints } from '../utils/formatPoints';
import { Button } from './ui/button';

export function FinalResults() {
  const { players } = useGame();
  const sortedPlayers = [...players].sort((a, b) => b.currentPoint - a.currentPoint);

  return (
    <div className="h-full w-full bg-white text-slate-900 p-4 flex flex-col gap-2 overflow-hidden">
      <div className="text-center flex-shrink-0">
        <h2 className="text-xl font-black tracking-tight text-blue-600 uppercase">
          最終結果発表
        </h2>
        <p className="text-[9px] text-slate-400 uppercase tracking-[0.4em]">ランキング & 報酬</p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 items-end">
        {/* Top 3 Podiums */}
        <div className="flex-1 flex items-end justify-center gap-2 pb-2 h-full">
          {/* 2nd Place */}
          {sortedPlayers[1] && (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center text-lg font-black text-white"
                style={{ backgroundColor: sortedPlayers[1].color }}
              >
                {sortedPlayers[1].name[0]}
              </div>
              <div className="h-20 w-20 bg-slate-50 border border-slate-200 rounded-t-xl flex flex-col items-center justify-center p-1.5 shadow-sm">
                <Medal className="size-4 text-slate-400 mb-0.5" />
                <div className="text-[9px] font-black truncate w-full text-center" style={{ color: sortedPlayers[1].color }}>{sortedPlayers[1].name}</div>
                <div className="text-[10px] font-black text-slate-500">{formatPoints(sortedPlayers[1].currentPoint)} ポイント</div>
                <div className="text-[8px] font-bold text-slate-300 uppercase">2位</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {sortedPlayers[0] && (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center text-2xl font-black text-white shadow-lg"
                style={{ backgroundColor: sortedPlayers[0].color }}
              >
                {sortedPlayers[0].name[0]}
              </div>
              <div className="h-28 w-24 bg-white border border-slate-200 rounded-t-xl flex flex-col items-center justify-center p-2 relative shadow-md">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
                <Trophy className="size-6 text-yellow-500 mb-1" />
                <div className="text-[10px] font-black truncate w-full text-center" style={{ color: sortedPlayers[0].color }}>{sortedPlayers[0].name}</div>
                <div className="text-xs font-black text-blue-600">{formatPoints(sortedPlayers[0].currentPoint)} ポイント</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">優勝者</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {sortedPlayers[2] && (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-base font-black text-white"
                style={{ backgroundColor: sortedPlayers[2].color }}
              >
                {sortedPlayers[2].name[0]}
              </div>
              <div className="h-16 w-18 bg-slate-50 border border-slate-200 rounded-t-xl flex flex-col items-center justify-center p-1.5 shadow-sm">
                <Award className="size-3.5 text-amber-600 mb-0.5" />
                <div className="text-[8px] font-black truncate w-full text-center" style={{ color: sortedPlayers[2].color }}>{sortedPlayers[2].name}</div>
                <div className="text-[9px] font-black text-amber-600">{formatPoints(sortedPlayers[2].currentPoint)} ポイント</div>
                <div className="text-[8px] font-bold text-slate-300 uppercase">3位</div>
              </div>
            </div>
          )}
        </div>

        {/* Other Players List & Action */}
        <div className="w-[200px] h-full flex flex-col gap-2">
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col min-h-0">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">最終ランキング</h4>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1">
              {sortedPlayers.slice(3).length > 0 ? (
                sortedPlayers.slice(3).map((player, index) => (
                  <div key={player.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-[8px] font-black text-slate-300">{index + 4}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }}></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black truncate" style={{ color: player.color }}>{player.name}</div>
                    </div>
                    <div className="text-[9px] font-black text-slate-500">{formatPoints(player.currentPoint)} ポイント</div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-[8px] text-slate-300 font-bold italic">その他の参加者はいません</div>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 font-black text-[10px] rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="size-3 mr-2" />
            もう一度遊ぶ
          </Button>
        </div>
      </div>
    </div>
  );
}

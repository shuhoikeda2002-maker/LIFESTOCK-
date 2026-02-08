import { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { LifeGraph } from './LifeGraph';
import { formatPoints } from '../utils/formatPoints';

const interpolateGraph = (anchorPoints: any[], maxAge: number) => {
  if (!anchorPoints || anchorPoints.length === 0) return {};
  const result: { [age: number]: number } = {};
  for (let age = 0; age <= maxAge; age++) {
    if (age < anchorPoints[0].age) result[age] = anchorPoints[0].score;
    else if (age > anchorPoints[anchorPoints.length - 1].age) result[age] = anchorPoints[anchorPoints.length - 1].score;
    else {
      let i = 0;
      while (i < anchorPoints.length - 1 && anchorPoints[i + 1].age <= age) i++;
      if (anchorPoints[i].age === age) result[age] = anchorPoints[i].score;
      else {
        const t = (age - anchorPoints[i].age) / (anchorPoints[i + 1].age - anchorPoints[i].age);
        result[age] = Math.round(anchorPoints[i].score + t * (anchorPoints[i + 1].score - anchorPoints[i].score));
      }
    }
  }
  return result;
};

export function ResultsPhase() {
  const { players, getCurrentRound, updateRound, setPhase, addRound, currentRound, gameMode, isHost, currentCompanyName, setPlayers, updatePlayersAndRounds } = useGame();
  const [calculatedInvestments, setCalculatedInvestments] = useState<any[]>([]);
  const [revealProgress, setRevealProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const round = getCurrentRound();
  const company = players.find(p => p.id === round?.companyId);
  const maxAge = company?.age || 100;

  useEffect(() => {
    if (!round || !round.investments || !round.anchorPoints || round.anchorPoints.length === 0) return;
    
    // 【重要】すでに計算・確定済みのラウンドであれば、保存されているデータをセットして終了
    if (round.completed) {
      if (calculatedInvestments.length === 0 && round.investments.length > 0) {
        setCalculatedInvestments(round.investments);
      }
      return;
    }

    try {
      const graphData = interpolateGraph(round.anchorPoints, maxAge);
      const results = round.investments.map(inv => {
        const rawBuyScore = graphData[inv.buyAge] || 0;
        const rawSellScore = graphData[inv.sellAge] || 0;
        const buyScore = Math.max(rawBuyScore, 1);
        const sellScore = Math.max(rawSellScore, 1);
        
        let pointsGained = Math.round(inv.investmentPoints * (sellScore / buyScore));
        if (sellScore < buyScore) {
          pointsGained = -Math.abs(pointsGained);
        }
        
        return { ...inv, buyScore: rawBuyScore, sellScore: rawSellScore, pointsGained };
      });
      
      setCalculatedInvestments(results);
      
      const shouldUpdate = gameMode === 'local' || isHost;
      if (shouldUpdate && !round.completed) {
        // 現在のプレイヤー状態をもとに累積計算を行う
        const newPlayers = players.map(player => {
          const result = results.find(r => r.investorId === player.id);
          if (result) {
            // 前回のポイント(currentPoint)に今回の獲得分を加算して累積
            return { ...player, currentPoint: (player.currentPoint || 0) + result.pointsGained };
          }
          return player;
        });

        // プレイヤーとラウンドの状態を一括で更新し、オンライン時は一度に同期する
        updatePlayersAndRounds(newPlayers, round.roundNumber, { 
          investments: results, 
          completed: true 
        });
      }
      
      startRevealAnimation();
    } catch (err) {
      console.error("Error calculating results:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.roundNumber, round?.anchorPoints?.length, round?.investments?.length, isHost, gameMode, round?.completed]);

  const canControl = gameMode === 'local' || isHost;

  const startRevealAnimation = () => {
    setIsAnimating(true);
    setRevealProgress(0);
    const duration = 6000; 
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setRevealProgress(progress);
      if (progress < 100) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    requestAnimationFrame(animate);
  };

  const handleNextRound = () => {
    setPhase('round-summary');
  };

  return (
    <div className="h-full w-full p-3 flex flex-col gap-2 overflow-hidden bg-white text-slate-900">
      <div className="flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-black tracking-tighter text-blue-600 uppercase">
          ラウンド結果
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            カンパニー: <span style={{ color: company?.color || '#000' }}>{currentCompanyName || company?.name}</span>
          </div>
          <div className="bg-slate-100 px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest border border-slate-200">
            お題: <span className="text-blue-600">{round?.topic}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col min-h-0">
          <div className="flex justify-between items-center px-1 mb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">人生の推移</span>
            {isAnimating && <span className="text-[9px] text-blue-600 animate-pulse font-black">公開中... {Math.round(revealProgress)}%</span>}
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            <LifeGraph
              anchorPoints={round?.anchorPoints || []}
              highlightAges={calculatedInvestments.map(inv => {
                const investor = players.find(p => p.id === inv.investorId);
                return {
                  buyAge: inv.buyAge,
                  sellAge: inv.sellAge,
                  investorName: investor?.name || '',
                  investorColor: investor?.color || '#3B82F6',
                };
              })}
              maxAge={maxAge}
              revealProgress={revealProgress}
            />
          </div>
        </div>

        <div className="w-[240px] flex flex-col gap-2 min-h-0">
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-1.5">
              {calculatedInvestments
                .sort((a, b) => b.pointsGained - a.pointsGained)
                .map((inv, index) => {
                  const investor = players.find(p => p.id === inv.investorId);
                  const isProfit = inv.pointsGained > 0;
                  return (
                    <div key={inv.investorId} className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: investor?.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black truncate text-slate-900">{investor?.name}</div>
                        <div className="text-[7px] text-blue-600 font-black">
                          合計: {formatPoints(investor?.currentPoint || 0)} pt
                        </div>
                        <div className="text-[7px] text-slate-400 font-bold">
                          {inv.buyAge}歳({inv.buyScore}) → {inv.sellAge}歳({inv.sellScore})
                        </div>
                      </div>
                      <div className={`text-right ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                        <div className="text-[9px] font-black leading-none">{isProfit ? '+' : ''}{formatPoints(inv.pointsGained)}</div>
                        <div className="text-[7px] font-bold opacity-50 uppercase mt-0.5">今回の獲得</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {canControl ? (
            <Button 
              className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50" 
              onClick={handleNextRound} 
              disabled={isAnimating}
            >
              結果詳細へ
            </Button>
          ) : (
            <div className="text-center py-2 text-slate-400 font-bold text-[10px]">
              {isAnimating ? '結果公開中...' : 'ホストの操作を待機中...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

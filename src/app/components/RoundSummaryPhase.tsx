import { useEffect, useMemo } from 'react';
import { useGame, Round } from '../contexts/GameContext';
import { Button } from './ui/button';
import { formatPoints } from '../utils/formatPoints';
import { Trophy } from 'lucide-react';
import { LifeGraph } from './LifeGraph';

export function RoundSummaryPhase() {
  const { 
    players, 
    getCurrentRound, 
    updateRound, 
    setPhase, 
    currentRound, 
    gameMode, 
    isHost, 
    sendEvent, 
    playerId,
    advanceToNextRound,
    currentCompanyName
  } = useGame();
  
  const round = getCurrentRound();
  const company = players.find(p => p.id === round?.companyId);
  
  // オンライン時はホストのみが進行を制御できるが、全員が準備完了ボタンを押す必要がある
  const canControl = gameMode === 'local' || isHost;
  
  const readyPlayers = useMemo(() => round?.readyPlayers || [], [round]);
  const isReady = useMemo(() => readyPlayers.includes(playerId), [readyPlayers, playerId]);

  // ランキング計算
  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.currentPoint - a.currentPoint);
  }, [players]);
  
  const investorMarkers = useMemo(() => {
    return round?.investments?.flatMap(inv => {
      const investor = players.find(p => p.id === inv.investorId);
      return [
        { age: inv.buyAge, type: 'buy' as const, color: investor?.color || '#fff', name: investor?.name || '' },
        { age: inv.sellAge, type: 'sell' as const, color: investor?.color || '#fff', name: investor?.name || '' }
      ];
    }) || [];
  }, [round, players]);

  // 次のラウンドへ進む処理 (ホストまたはローカル用)
  const handleNext = () => {
    if (!canControl) return;
    if (players.length === 0) return;

    // すでに次のラウンドに移行中か、次のラウンドが計算済みなら何もしない
    const nextRoundNumber = currentRound + 1;
    if (round && round.roundNumber >= nextRoundNumber) return;

    // ゲーム終了判定：全員がカンパニーを担当したか
    if (currentRound >= players.length) {
      setPhase('final-results');
      return;
    }

    // カンパニーを再計算（入室順ベース）
    const nextCompanyIndex = (nextRoundNumber - 1) % players.length;
    const nextCompany = players[nextCompanyIndex];
    
    // 次のラウンド用オブジェクトを作成
    const nextRound: Round = {
      roundNumber: nextRoundNumber,
      companyId: nextCompany.id,
      companyIndex: nextCompanyIndex,
      companyName: nextCompany.name,
      topic: '',
      topicConfirmed: false,
      anchorPoints: [],
      questions: [],
      investments: [],
      completed: false,
      readyPlayers: [],
      timerValue: undefined,
      rouletteState: {
        isSpinning: false,
        displayTopic: '',
        finalTopic: undefined
      }
    };
    
    advanceToNextRound(nextRound);
  };

  // オンラインモード：全員が準備完了になったらホストが自動的に進める
  useEffect(() => {
    if (gameMode === 'online' && isHost && round) {
      // プレイヤーが全員揃っており、かつ全員が準備完了ボタンを押している場合
      if (players.length > 0 && readyPlayers.length >= players.length) {
        // 次のラウンドへ進む
        handleNext();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyPlayers.length, players.length, isHost, gameMode, round?.roundNumber]);

  const handleReady = () => {
    if (gameMode === 'online') {
      // オンライン時は準備完了状態を送信/更新
      if (isHost) {
        if (round && !readyPlayers.includes(playerId)) {
          updateRound(round.roundNumber, { 
            readyPlayers: [...readyPlayers, playerId] 
          });
        }
      } else {
        // ゲストはイベントを送信
        sendEvent('player_ready_next', { playerId, roundNumber: round?.roundNumber });
      }
    } else {
      // ローカル時は即座に次へ
      handleNext();
    }
  };

  return (
    <div className="h-full w-full bg-white text-slate-900 p-3 flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-[780px] h-full max-h-[355px] flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-end px-1">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black tracking-widest text-slate-400 border border-slate-200 uppercase">
              Round {round?.roundNumber} Result
            </div>
            <h2 className="text-xl font-black tracking-tighter leading-none text-slate-900">
              <span className="text-slate-400 mr-1.5 text-sm uppercase">Company:</span>
              <span style={{ color: company?.color || '#000' }}>{currentCompanyName || company?.name}</span>
            </h2>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Topic</div>
            <div className="text-sm font-black text-blue-600">
              {round?.topic}
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-2 min-h-0">
          <div className="w-[150px] bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Trophy className="size-3 text-yellow-600" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ランキング</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {rankedPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
                    index < 3 ? 'bg-white border-slate-200 shadow-sm' : 'bg-transparent border-transparent'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black ${
                    index === 0 ? 'bg-yellow-400 text-white shadow-sm' :
                    index === 1 ? 'bg-slate-300 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-black truncate leading-tight text-slate-900">{player.name}</div>
                      <div className="text-[8px] font-bold text-blue-600 leading-tight">{formatPoints(player.currentPoint)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col relative overflow-hidden">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest absolute top-2 left-3 z-10 flex items-center gap-2">
              <span>投資ポジション可視化</span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-0">
              <LifeGraph
                anchorPoints={round?.anchorPoints || []}
                maxAge={company?.age || 100}
                investorPoints={investorMarkers}
                showLabels={true}
              />
            </div>
          </div>

          <div className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">投資結果</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {round?.investments?.map((inv) => {
                const investor = players.find(p => p.id === inv.investorId);
                const isProfit = (inv.pointsGained || 0) > 0;
                const isLoss = (inv.pointsGained || 0) < 0;

                return (
                  <div key={inv.investorId} className="p-1.5 bg-white border border-slate-100 rounded-lg flex flex-col gap-0.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: investor?.color }} />
                        <div className="text-[9px] font-black truncate text-slate-900">{investor?.name}</div>
                      </div>
                      <div className={`text-[9px] font-black ${isProfit ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-slate-400'}`}>
                        {isProfit ? '+' : ''}{formatPoints(inv.pointsGained || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 mt-0.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {gameMode === 'online' 
              ? `準備完了: ${readyPlayers.length} / ${players.length}`
              : '内容を確認して次へ進んでください'}
          </div>
          <Button
            className={`h-9 px-8 font-black text-xs rounded-lg shadow-lg transition-all active:scale-95 ${
              isReady ? 'bg-green-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
            onClick={handleReady}
            disabled={isReady}
          >
            {currentRound < players.length ? '次のラウンドへ' : '最終結果へ'}
          </Button>
        </div>
      </div>
    </div>
  );
}

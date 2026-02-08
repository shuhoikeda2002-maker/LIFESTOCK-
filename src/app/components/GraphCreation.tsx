import { useState, useEffect } from 'react';
import { useGame, AnchorPoint } from '../contexts/GameContext';
import { Button } from './ui/button';
import { LifeGraph } from './LifeGraph';

export function GraphCreation() {
  const { players, getCurrentRound, updateRound, setPhase, gameMode, playerId, isCompany, currentRound, updateRoundAndPhase, currentCompanyName } = useGame();
  const [anchorPoints, setAnchorPoints] = useState<AnchorPoint[]>([]);
  const [error, setError] = useState('');

  const round = getCurrentRound();
  const company = players.find(p => p.id === round?.companyId);
  const maxAge = company?.age || 100;
  
  // Reset local state on round change
  useEffect(() => {
    setAnchorPoints([]);
    setError('');
  }, [round?.roundNumber]);
  
  const handlePointClick = (age: number, score: number) => {
    if (!isCompany) return;
    const existingIndex = anchorPoints.findIndex(p => p.age === age);

    if (existingIndex !== -1) {
      const existingPoint = anchorPoints[existingIndex];
      if (Math.abs(existingPoint.score - score) < 5) {
        setAnchorPoints(anchorPoints.filter((_, i) => i !== existingIndex));
        setError('');
      } else {
        const newPoints = [...anchorPoints];
        newPoints[existingIndex] = { age, score };
        setAnchorPoints(newPoints.sort((a, b) => a.age - b.age));
        setError('');
      }
      return;
    }

    if (anchorPoints.length < 10) {
      setAnchorPoints([...anchorPoints, { age, score }].sort((a, b) => a.age - b.age));
      setError('');
    } else {
      setError('最大10ポイントまで配置可能です');
    }
  };

  const hasStartPoint = anchorPoints.some(p => p.age === 0);
  const hasEndPoint = anchorPoints.some(p => p.age === maxAge);

  const validateAndSubmit = () => {
    if (!hasStartPoint || !hasEndPoint) {
      setError('0歳と最大年齢にポイントを配置してください');
      return;
    }
    if (anchorPoints.length < 5) {
      setError('最低5つのポイントを配置してください');
      return;
    }
    const scores = anchorPoints.map(p => p.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    if (max - min < 50) {
      setError('高低差50pt以上の変化をつけてください');
      return;
    }
    if (!round) return;
    
    // 必須実装ルール：graphCompleted = true かつ phase = "questions" に遷移
    // 2ラウンド目以降でも確実に同期するため updateRoundAndPhase を使用
    if (gameMode === 'online') {
      updateRoundAndPhase(currentRound, { 
        anchorPoints, 
        graphCompleted: true
      }, 'questions');
    } else {
      updateRound(round.roundNumber, { 
        anchorPoints, 
        graphCompleted: true
      });
      setPhase('questions');
    }
  };

  return (
    <div className="h-full w-full bg-white text-slate-900 p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-blue-600">
            グラフの作成
          </h2>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            カンパニー: <span className="font-bold" style={{ color: company?.color || '#000' }}>{currentCompanyName || company?.name}</span> さん
          </p>
        </div>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-200">
          お題: <span className="text-blue-600">{round?.topic}</span>
        </div>
      </div>

      {!isCompany ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="size-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">{company?.name || 'カンパニー'}さんが人生グラフを作成しています...</p>
            <p className="text-sm text-slate-400">作成が終わるまでお待ちください</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-[180px] flex flex-col gap-3 flex-shrink-0">
            <div className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
              (anchorPoints.length < 5 || !hasStartPoint || !hasEndPoint) ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
            }`}>
              <div className="text-3xl font-black">{anchorPoints.length}<span className="text-sm opacity-30 mx-1">/</span>10</div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mt-1">配置済みポイント</div>
            </div>

            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col min-h-0">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">作成条件</h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {[
                  { label: '0歳のポイント', done: hasStartPoint },
                  { label: `${maxAge}歳のポイント`, done: hasEndPoint },
                  { label: '最低5ポイント', done: anchorPoints.length >= 5 },
                  { label: '高低差50pt以上', done: (Math.max(...anchorPoints.map(p => p.score), 0) - Math.min(...anchorPoints.map(p => p.score), 100)) >= 50 },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${req.done ? 'bg-green-600' : 'bg-slate-200'}`}></div>
                    <span className={`text-[9px] font-bold ${req.done ? 'text-slate-900' : 'text-slate-300'}`}>{req.label}</span>
                  </div>
                ))}
                {error && <div className="text-[9px] font-black text-red-600 bg-red-50 p-2 rounded border border-red-100 leading-tight">{error}</div>}
              </div>
            </div>

            <Button
              className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 font-black text-sm rounded-xl"
              onClick={validateAndSubmit}
              disabled={anchorPoints.length < 5 || !hasStartPoint || !hasEndPoint}
            >
              作成完了
            </Button>
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col min-h-0 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-[9px] font-black text-slate-300 uppercase tracking-widest z-10 pointer-events-none">
              クリックでポイントを配置
            </div>
            <div className="flex-1 flex items-center justify-center p-1">
              <LifeGraph
                anchorPoints={anchorPoints}
                onPointClick={handlePointClick}
                interactive
                maxAge={maxAge}
                showLabels={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

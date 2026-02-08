import { useState, useEffect } from 'react';
import { useGame, Investment } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { formatPoints } from '../utils/formatPoints';

export function InvestmentPhase() {
  const { players, getCurrentRound, updateRound, setPhase, gameMode, playerId, isHost, sendEvent, isCompany, currentCompanyName } = useGame();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0);
  const [buyAge, setBuyAge] = useState('');
  const [sellAge, setSellAge] = useState('');
  const [investmentPoints, setInvestmentPoints] = useState('');
  const [error, setError] = useState('');

  const round = getCurrentRound();
  const company = players.find(p => p.id === round?.companyId);
  const maxAge = company?.age || 100;
  const investors = players.filter(p => p.id !== round?.companyId);

  // isCompany はコンテキストから取得する

  useEffect(() => {
    setBuyAge('');
    setSellAge('');
    setInvestmentPoints('');
    setError('');
    // ローカル・オンライン問わず、ラウンドが変わったらインデックス等をリセット
    setCurrentInvestorIndex(0);
    if (gameMode === 'local') {
      setInvestments([]);
    }
  }, [round?.roundNumber, gameMode]);
  
  const myInvestment = gameMode === 'online' ? round?.investments?.find(i => i.investorId === playerId) : null;
  const hasSubmitted = !!myInvestment;

  const currentInvestor = investors[currentInvestorIndex];
  const currentInvestorData = players.find(p => p.id === (gameMode === 'online' ? playerId : currentInvestor?.id));

  const handleSubmitInvestment = () => {
    if (!round) return;
    setError('');

    const buyValue = buyAge.trim();
    const sellValue = sellAge.trim();
    const pointsValue = investmentPoints.trim();

    if (buyValue === '' || sellValue === '') {
      setError('年齢を入力してください');
      return;
    }

    const buy = Math.floor(Number(buyValue));
    const sell = Math.floor(Number(sellValue));
    const points = Math.floor(Number(pointsValue));

    if (isNaN(buy) || isNaN(sell)) {
      setError('年齢を正しく入力してください');
      return;
    }
    if (isNaN(points) || points <= 0) {
      setError('投資ポイントを入力してください');
      return;
    }
    
    const availablePoints = currentInvestorData?.currentPoint || 0;
    if (!currentInvestorData || points > availablePoints) {
      setError(`上限: ${formatPoints(availablePoints)}pt`);
      return;
    }
    
    if (buy < 0 || buy > maxAge || sell < 0 || sell > maxAge) {
      setError(`範囲: 0〜${maxAge}歳`);
      return;
    }
    if (buy === sell) {
      setError('買値と売値は異なる年齢に');
      return;
    }

    const investment: Investment = {
      investorId: gameMode === 'online' ? playerId : currentInvestor.id,
      buyAge: buy,
      sellAge: sell,
      investmentPoints: points,
    };

    if (gameMode === 'online') {
      if (isHost) {
        const currentInvestments = round.investments || [];
        const existingIndex = currentInvestments.findIndex(i => i.investorId === playerId);
        let newInvestments;
        if (existingIndex !== -1) {
          newInvestments = [...currentInvestments];
          newInvestments[existingIndex] = investment;
        } else {
          newInvestments = [...currentInvestments, investment];
        }
        updateRound(round.roundNumber, { investments: newInvestments });
      } else {
        sendEvent('investment_submit', { investment, roundNumber: round.roundNumber });
      }
      return;
    }

    const newInvestments = [...investments, investment];
    setInvestments(newInvestments);
    setBuyAge('');
    setSellAge('');
    setInvestmentPoints('');

    if (currentInvestorIndex < investors.length - 1) {
      setCurrentInvestorIndex(currentInvestorIndex + 1);
    } else {
      updateRound(round.roundNumber, { investments: newInvestments });
      setPhase('results-reveal');
    }
  };

  useEffect(() => {
    if (gameMode === 'online' && isHost && round) {
      const investorsCount = investors.length;
      const investmentsCount = round.investments.length;
      
      if (investorsCount > 0 && investmentsCount === investorsCount) {
        setPhase('results-reveal');
      }
    }
  }, [gameMode, isHost, round?.investments.length, investors.length, setPhase]);

  if (gameMode === 'online' && (isCompany || hasSubmitted)) {
    return (
      <div className="h-full w-full bg-white text-slate-900 p-4 flex items-center justify-center overflow-hidden">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="size-16 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin" />
          <div>
            <p className="text-xl font-black">{hasSubmitted ? '投資完了！' : '投資タイム'}</p>
            <p className="text-sm text-slate-400 font-bold mt-1">他のプレイヤーが完了するのを待っています...</p>
          </div>
          <div className="flex gap-2 mt-4">
            {investors.map(inv => {
              const submitted = round?.investments?.some(i => i.investorId === inv.id);
              return (
                <div key={inv.id} className="flex flex-col items-center gap-1 opacity-80">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${submitted ? 'bg-green-50 border-green-50 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                    {submitted ? '✓' : ''}
                  </div>
                  <div className="text-[8px] font-black uppercase truncate w-12 text-center">{inv.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white text-slate-900 p-4 flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-6 z-20">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest">
          カンパニー: <span className="font-bold" style={{ color: company?.color || '#000' }}>{currentCompanyName || company?.name}</span> さん
        </p>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-50 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[700px] h-full max-h-[340px] bg-white border border-slate-200 rounded-[24px] p-4 relative shadow-2xl flex flex-col justify-between">
        <div className="flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: currentInvestorData?.color }}></div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none mb-1 text-slate-900">
                {currentInvestorData?.name} <span className="text-slate-400 text-[10px] font-bold uppercase ml-1">の投資</span>
              </h2>
              <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 inline-block">
                所持: {formatPoints(currentInvestorData?.currentPoint || 0)} pt
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">お題</div>
            <div className="text-lg font-black text-slate-900 leading-none">{round?.topic}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">投資ポイント</Label>
            <div className="relative">
              <Input
                type="number"
                value={investmentPoints}
                onChange={(e) => setInvestmentPoints(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 h-12 text-2xl font-black focus:ring-2 focus:ring-blue-500/50 rounded-2xl pl-5 w-full transition-all"
                placeholder="0"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">Pts</div>
            </div>
            {error && error.includes('上限') ? (
              <p className="text-red-500 text-[9px] font-bold ml-1">{error}</p>
            ) : <div className="h-[10px]"></div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">買いの年齢</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={buyAge}
                  onChange={(e) => setBuyAge(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-10 text-lg font-black focus:ring-2 focus:ring-blue-500/50 rounded-xl pl-4"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">売りの年齢</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={sellAge}
                  onChange={(e) => setSellAge(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-10 text-lg font-black focus:ring-2 focus:ring-blue-500/50 rounded-xl pl-4"
                  placeholder={maxAge.toString()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-4 flex items-center justify-center">
          {error && !error.includes('上限') && (
            <div className="px-4 py-0.5 bg-red-50 border border-red-100 rounded-lg text-red-500 text-[8px] font-bold text-center">
              {error}
            </div>
          )}
        </div>

        <Button
          className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex-shrink-0 mt-1"
          onClick={handleSubmitInvestment}
        >
          投資を確定する
        </Button>
      </div>

      <div className="absolute bottom-2 flex gap-1.5">
        {investors.map((inv, i) => {
          const isSubmitted = gameMode === 'online' 
            ? round?.investments?.some(ir => ir.investorId === inv.id)
            : i < currentInvestorIndex;
          const isCurrent = gameMode === 'online'
            ? inv.id === playerId
            : i === currentInvestorIndex;
            
          return (
            <div 
              key={inv.id} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                isSubmitted ? 'bg-green-600' : 
                isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

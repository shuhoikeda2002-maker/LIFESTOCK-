import { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Sparkles } from 'lucide-react';

const DEFAULT_TOPICS = [
  '人生の幸福度', '人生の充実度', '夢や希望の大きさ', '生きるエネルギー量',
  '自由時間量', '自己肯定感', 'ストレスレベル', '「自分、輝いてる」感',
  'モテ度', '恋愛体質度', '理想の高さ', 'スケベ度', 'ロマンチスト度',
  'リッチ度', '成績レベル', '物欲レベル', '友達の量', 'コミュ力',
  '空気読み力', 'SNS依存度', '嘘の頻度', '目立ちたがり度', 'メンタル安定度',
  '黒歴史レベル', '中二病レベル', 'ストイックさ', '優しさレベル',
  '怒りっぽさレベル', '好奇心の強さ', 'プライドの高さ', 'ネガティブ度',
  '几帳面さ', '理性の強さ', '知識欲レベル', '世渡り力', '陽キャ度',
  '情の深さ', '危機管理能力', '変人度', '人生イージーモード感',
];

export function TopicSelection() {
  const { 
    players,
    currentRound, 
    updateRound, 
    setPhase, 
    getCurrentRound, 
    gameMode, 
    updateRoundAndPhase, 
    isCompany,
    currentCompanyName
  } = useGame();
  
  const [customTopic, setCustomTopic] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [displayTopic, setDisplayTopic] = useState('');
  const intervalRef = useRef<any>(null);

  const round = getCurrentRound();
  const company = players.find(p => p.id === round?.companyId);

  // ラウンド切り替え時やマウント時に状態を完全にリセットする
  useEffect(() => {
    setIsSpinning(false);
    setDisplayTopic('');
    setSelectedTopic('');
    setCustomTopic('');
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [currentRound]);

  // Sync state with shared rouletteState
  useEffect(() => {
    if (!round || round.roundNumber !== currentRound) return;

    if (gameMode === 'online' && round.rouletteState) {
      const { isSpinning: serverIsSpinning, displayTopic: serverDisplayTopic, finalTopic } = round.rouletteState;
      
      // 他のプレイヤーからの抽選開始合図
      if (serverIsSpinning && !isSpinning) {
        startLocalAnimation(finalTopic || '');
      } 
      // 抽選終了または初期状態
      else if (!serverIsSpinning && !isSpinning) {
        if (serverDisplayTopic) setDisplayTopic(serverDisplayTopic);
        if (finalTopic) setSelectedTopic(finalTopic);
      }
    } else if (gameMode === 'local') {
      if (!isSpinning && displayTopic === '' && round.topic) {
        setDisplayTopic(round.topic);
        setSelectedTopic(round.topic);
      }
    }
  }, [round?.rouletteState, gameMode, currentRound, isSpinning, displayTopic]);

  const startLocalAnimation = (targetTopic: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSpinning(true);
    let count = 0;
    const maxSpins = 20;

    intervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * DEFAULT_TOPICS.length);
      setDisplayTopic(DEFAULT_TOPICS[randomIndex]);
      count++;

      if (count >= maxSpins) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalTopic = targetTopic || DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];
        setDisplayTopic(finalTopic);
        setSelectedTopic(finalTopic);
        setIsSpinning(false);
        
        if (isCompany && gameMode === 'online') {
          updateRound(currentRound, { 
            rouletteState: { 
              isSpinning: false, 
              displayTopic: finalTopic, 
              finalTopic: finalTopic 
            } 
          });
        }
      }
    }, 80);
  };

  const spinRoulette = () => {
    // 必須実装ルール：currentUser.id === companyId ・ phase === "topic-selection"
    // (phase は親コンポーネントで制御されているため、ここでは isCompany のみチェック)
    if (!isCompany) return;
    
    // rouletteLocked (topicConfirmed) が true の場合は本来無効だが、
    // 状態リセットの不備を考慮し、roundNumber が現在のものかつ未確定であることを念のため確認
    if (round && round.roundNumber === currentRound && round.topicConfirmed) return;
    
    if (customTopic.trim() !== '') {
      const finalTopic = customTopic.trim();
      setDisplayTopic(finalTopic);
      setSelectedTopic(finalTopic);
      if (gameMode === 'online') {
        updateRound(currentRound, { 
          rouletteState: { 
            isSpinning: false, 
            displayTopic: finalTopic, 
            finalTopic: finalTopic 
          } 
        });
      }
      return;
    }

    const finalIndex = Math.floor(Math.random() * DEFAULT_TOPICS.length);
    const finalTopic = DEFAULT_TOPICS[finalIndex];

    if (gameMode === 'online') {
      updateRound(currentRound, { 
        rouletteState: { 
          isSpinning: true, 
          displayTopic: '', 
          finalTopic: finalTopic 
        } 
      });
    } else {
      startLocalAnimation(finalTopic);
    }
  };

  const handleConfirmTopic = () => {
    if (!isCompany) return;

    const finalTopic = customTopic.trim() !== '' ? customTopic.trim() : selectedTopic;
    
    if (!finalTopic) {
      alert('ルーレットを回してお題を決定してください');
      return;
    }

    if (gameMode === 'online') {
      updateRoundAndPhase(currentRound, { 
        topic: finalTopic,
        topicConfirmed: true,
        rouletteState: { 
          isSpinning: false, 
          displayTopic: finalTopic, 
          finalTopic: finalTopic 
        } 
      }, 'graph-creation');
    } else {
      updateRound(currentRound, { 
        topic: finalTopic,
        topicConfirmed: true
      });
      setPhase('graph-creation');
    }
  };

  return (
    <div className="h-full w-full bg-white text-slate-900 p-4 flex flex-col gap-3 overflow-hidden">
      <div className="text-center flex-shrink-0">
        <h2 className="text-xl font-black tracking-tight text-blue-600 leading-tight">
          お題の決定
        </h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
          カンパニー: <span className="font-bold" style={{ color: company?.color || '#000' }}>{currentCompanyName}</span> さん
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 items-center justify-center">
        {isCompany ? (
          <div className="w-[280px] flex flex-col gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl relative overflow-hidden flex-1 flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <label className="block text-[10px] font-black mb-1.5 text-blue-600 uppercase tracking-wider">カスタムお題を入力</label>
              <Input
                placeholder="例：野球への情熱..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-9 text-xs"
              />
              <p className="text-[9px] text-slate-400 mt-1.5 italic leading-tight">
                ※入力するとルーレットより優先されます
              </p>
            </div>
            
            <Button
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg"
              onClick={handleConfirmTopic}
              disabled={isSpinning || (!selectedTopic && customTopic.trim() === '')}
            >
              このお題で決定する
            </Button>
          </div>
        ) : (
          <div className="w-[280px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mb-2 text-center">決定状況</p>
            {round?.topicConfirmed ? (
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{round.topic}</h3>
                <p className="text-[9px] text-slate-400 mt-2">グラフ作成中...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-bold text-slate-500">カンパニーがお題を決定しています...</p>
                <div className="mt-4 flex justify-center">
                  <div className="size-5 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 max-w-[360px] flex flex-col gap-3">
          <div 
            className={`w-full h-28 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 shadow-inner relative overflow-hidden transition-all duration-300 ${
              isSpinning ? 'border-blue-500/30' : ''
            }`}
          >
            <div className={`text-center px-4 relative z-10 font-black text-xl transition-all ${isSpinning ? 'blur-[0.5px] opacity-70' : ''}`}>
              {displayTopic || <span className="text-slate-200 tracking-widest text-sm uppercase">待機中...</span>}
            </div>
          </div>

          <Button
            onClick={spinRoulette}
            disabled={isSpinning || !isCompany}
            className={`w-full h-10 font-black text-xs rounded-xl shadow-lg transition-all ${
              !isCompany ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="size-3.5 mr-2" />
            {isSpinning ? '抽選中...' : 'ルーレットを回す'}
          </Button>
        </div>
      </div>
    </div>
  );
}

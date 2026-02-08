import { useState, useEffect } from 'react';
import { useGame, PLAYER_COLORS, Player } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Users, Plus, X, Copy, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface GameSetupProps {
  onStart: () => void;
  onBack: () => void;
}

export function GameSetup({ onStart, onBack }: GameSetupProps) {
  const { 
    setPlayers, 
    setPhase, 
    phase,
    gameMode, 
    roomId, 
    setRoomId, 
    playerId, 
    setPlayerId, 
    isHost, 
    setIsHost,
    players,
    syncState,
    sendEvent
  } = useGame();
  
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [playerAges, setPlayerAges] = useState<string[]>(['', '']);
  
  // Online mode specific local state
  const [onlineName, setOnlineName] = useState('');
  const [onlineAge, setOnlineAge] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  // Local mode logic
  const addPlayer = () => {
    if (playerNames.length < 20) {
      setPlayerNames([...playerNames, '']);
      setPlayerAges([...playerAges, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
      setPlayerAges(playerAges.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const updatePlayerAge = (index: number, age: string) => {
    const newAges = [...playerAges];
    newAges[index] = age;
    setPlayerAges(newAges);
  };

  const startLocalGame = () => {
    const validPlayers = playerNames
      .map((name, index) => ({ name: name.trim(), age: playerAges[index] }))
      .filter(p => p.name !== '' && p.age !== '');
    
    if (validPlayers.length < 2) {
      toast.error('最低2人のプレイヤーが必要です');
      return;
    }

    const playersData = validPlayers.map((player, index) => ({
      id: `player-${index}`,
      name: player.name,
      age: parseInt(player.age),
      currentPoint: 10000,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));

    setPlayers(playersData);
    setPhase('topic-selection');
    onStart();
  };

  // Online mode logic
  const createRoom = () => {
    if (!onlineName || !onlineAge) {
      toast.error('名前と年齢を入力してください');
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingId = localStorage.getItem('lifestock_player_id');
    const newPlayerId = existingId || `player-${Math.random().toString(36).substring(2, 6)}`;
    if (!existingId) localStorage.setItem('lifestock_player_id', newPlayerId);
    
    setRoomId(newRoomId);
    setPlayerId(newPlayerId);
    setIsHost(true);
    
    const initialPlayer: Player = {
      id: newPlayerId,
      name: onlineName,
      age: parseInt(onlineAge),
      currentPoint: 10000,
      color: PLAYER_COLORS[0],
    };
    
    setPlayers([initialPlayer]);
    setIsJoined(true);
  };

  const joinRoom = () => {
    if (!onlineName || !onlineAge || !inputRoomId) {
      toast.error('名前、年齢、ルームIDを入力してください');
      return;
    }
    const existingId = localStorage.getItem('lifestock_player_id');
    const newPlayerId = existingId || `player-${Math.random().toString(36).substring(2, 6)}`;
    if (!existingId) localStorage.setItem('lifestock_player_id', newPlayerId);

    setRoomId(inputRoomId.toUpperCase());
    setPlayerId(newPlayerId);
    setIsHost(false);
    setIsJoined(true);
    // Joining handled by Realtime broadcast when host sees us or we send a join event
  };

  // When a guest joins, they should broadcast their presence
  useEffect(() => {
    if (gameMode === 'online' && isJoined && !isHost && roomId && playerId) {
      const joinTimeout = setTimeout(() => {
        sendEvent('player_join', {
          player: {
            id: playerId,
            name: onlineName,
            age: parseInt(onlineAge),
            currentPoint: 10000,
            color: PLAYER_COLORS[0], // ホストが上書きするため、ここではプレースホルダーを送信
          }
        });
      }, 500);
      return () => clearTimeout(joinTimeout);
    }
  }, [isJoined, isHost, gameMode, roomId, sendEvent, playerId, onlineName, onlineAge, players.length]);

  // Online mode: auto-start for guests when host changes phase
  useEffect(() => {
    if (gameMode === 'online' && !isHost && isJoined && phase !== 'setup') {
      onStart();
    }
  }, [phase, isHost, gameMode, isJoined, onStart]);

  const startOnlineGame = () => {
    if (players.length < 2) {
      toast.error('最低2人のプレイヤーが必要です');
      return;
    }
    setPhase('topic-selection');
    onStart();
    syncState({ phase: 'topic-selection' });
  };

  const copyRoomId = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('ルームIDをコピーしました');
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      // Fallback to execCommand('copy')
      try {
        const textArea = document.createElement("textarea");
        textArea.value = roomId;
        // Ensure textarea is not visible but part of the document
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('ルームIDをコピーしました');
        } else {
          throw new Error('Fallback copy failed');
        }
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
        toast.error('コピーに失敗しました。手動で入力してください');
      }
    }
  };

  if (gameMode === 'online') {
    return (
      <div className="h-full w-full bg-white text-slate-900 overflow-hidden p-6 flex flex-col gap-4">
        <div className="text-center relative flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-0 text-slate-400 hover:text-slate-600 font-bold gap-1"
          >
            <ArrowLeft className="size-4" />
            <span className="text-[10px] uppercase tracking-widest">スタート画面に戻る</span>
          </Button>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-indigo-600">
              オンライン対戦
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              {isJoined ? `ルーム: ${roomId}` : 'ルームを作成するか参加してください'}
            </p>
          </div>
        </div>

        {!isJoined ? (
          <div className="flex-1 flex gap-6 items-center justify-center">
            <div className="w-[300px] flex flex-col gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="space-y-3">
                <Input
                  placeholder="あなたの名前"
                  value={onlineName}
                  onChange={(e) => setOnlineName(e.target.value)}
                  className="bg-white"
                />
                <Input
                  type="number"
                  placeholder="年齢"
                  value={onlineAge}
                  onChange={(e) => setOnlineAge(e.target.value)}
                  className="bg-white"
                />
              </div>
              
              <div className="h-px bg-slate-200 my-2" />
              
              <Button 
                onClick={createRoom}
                className="w-full bg-indigo-600 text-white font-bold h-12 rounded-xl"
              >
                ルームを作成
              </Button>
              
              <div className="flex gap-2">
                <Input
                  placeholder="ルームID"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  className="bg-white uppercase font-bold text-center tracking-widest"
                />
                <Button 
                  onClick={joinRoom}
                  variant="outline"
                  className="border-indigo-200 text-indigo-600 font-bold px-6"
                >
                  参加
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 flex-1 min-h-0">
            {/* Left: Player List */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl p-4 overflow-hidden flex flex-col shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest px-2">参加中のプレイヤー ({players.length})</div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  {players.map((player, index) => (
                    <div key={player.id} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div 
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white shadow-sm" 
                        style={{ backgroundColor: player.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{player.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{player.age}歳</div>
                      </div>
                      {player.id === playerId && (
                        <div className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase">YOU</div>
                      )}
                    </div>
                  ))}
                  {players.length < 2 && (
                    <div className="col-span-2 py-8 text-center text-slate-300 italic text-sm">
                      他のプレイヤーの参加を待っています...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Room Info & Action */}
            <div className="w-[220px] flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ルームID</div>
                <div className="text-3xl font-black text-indigo-600 tracking-tighter mb-3">{roomId}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyRoomId}
                  className="h-8 text-indigo-600 hover:bg-indigo-50 font-bold"
                >
                  {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                  {copied ? 'コピー済み' : 'IDをコピー'}
                </Button>
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                {isHost ? (
                  <Button
                    className="w-full h-full bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xl rounded-2xl shadow-xl transition-transform active:scale-95 flex flex-col items-center justify-center"
                    onClick={startOnlineGame}
                    disabled={players.length < 2}
                  >
                    <span>ゲーム開始</span>
                    <span className="text-[10px] font-bold opacity-70 mt-1">ホストのみ操作可能</span>
                  </Button>
                ) : (
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center text-center opacity-70">
                    <div className="size-8 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin mb-3" />
                    <div className="text-xs font-bold text-slate-500">ホストの開始を<br/>待っています</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Local Mode (Existing Logic - UNCHANGED)
  return (
    <div className="h-full w-full bg-white text-slate-900 overflow-hidden p-6 flex flex-col gap-4">
      <div className="text-center relative flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="absolute left-0 text-slate-400 hover:text-slate-600 font-bold gap-1"
        >
          <ArrowLeft className="size-4" />
          <span className="text-[10px] uppercase tracking-widest">スタート画面に戻る</span>
        </Button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-blue-600">
            プレイヤー登録
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">2人から20人まで参加可能</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Player List */}
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl p-4 overflow-hidden flex flex-col shadow-sm">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
              {playerNames.map((name, index) => (
                <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 group transition-all hover:border-blue-200 shadow-sm">
                  <div 
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black border border-slate-100 text-white" 
                    style={{ backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <Input
                    placeholder={`名前`}
                    value={name}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    className="flex-1 h-9 bg-slate-50 border-slate-200 text-xs font-bold text-slate-900"
                  />
                  <Input
                    type="number"
                    placeholder="年齢"
                    value={playerAges[index]}
                    onChange={(e) => updatePlayerAge(index, e.target.value)}
                    className="w-16 h-9 bg-slate-50 border-slate-200 text-xs font-bold text-slate-900"
                  />
                  {playerNames.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlayer(index)}
                      className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {playerNames.length < 20 && (
            <Button
              variant="outline"
              className="mt-3 border-dashed border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 h-10 rounded-xl"
              onClick={addPlayer}
            >
              <Plus className="size-4 mr-2" />
              プレイヤーを追加
            </Button>
          )}
        </div>

        {/* Right: Summary & Action */}
        <div className="w-[220px] flex flex-col gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex-1 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <Users className="size-10 text-blue-200 mb-4 opacity-50" />
            <div className="text-4xl font-black text-slate-900">{playerNames.filter(n => n.trim() !== '').length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">準備完了</div>
          </div>
          
          <Button
            className="w-full h-16 bg-blue-600 text-white hover:bg-blue-700 font-black text-xl rounded-2xl shadow-xl transition-transform active:scale-95"
            onClick={startLocalGame}
          >
            決定
          </Button>
        </div>
      </div>
    </div>
  );
}

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../utils/supabase/client';

export const PLAYER_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  '#F43F5E', '#6366F1', '#A855F7', '#22D3EE', '#FDE047', '#FB923C', '#34D399', '#E11D48', '#7C3AED', '#0EA5E9',
];

export interface Player { id: string; name: string; age: number; currentPoint: number; color: string; }
export interface AnchorPoint { age: number; score: number; }
export interface Question { investorId: string; investorName: string; question: string; answer?: string; }
export interface Investment { investorId: string; buyAge: number; sellAge: number; investmentPoints: number; buyScore?: number; sellScore?: number; pointsGained?: number; }
export interface Round { 
  roundNumber: number; 
  companyId: string; 
  companyIndex: number; 
  companyName: string; 
  topic: string; 
  topicConfirmed?: boolean; 
  anchorPoints: AnchorPoint[]; 
  questions: Question[]; 
  investments: Investment[]; 
  completed: boolean; 
  graphCompleted?: boolean;
  timerValue?: number; 
  readyPlayers?: string[]; 
  rouletteState?: { isSpinning: boolean; displayTopic: string; finalTopic?: string; }; 
}
export type GamePhase = 'setup' | 'topic-selection' | 'graph-creation' | 'questions' | 'investment' | 'results-reveal' | 'results' | 'round-summary' | 'final-results';

interface GameContextType {
  players: Player[]; setPlayers: (players: Player[]) => void;
  currentRound: number; rounds: Round[];
  addRound: (round: Round) => void;
  updateRound: (roundNumber: number, updates: Partial<Round>) => void;
  updatePlayerPoints: (playerId: string, points: number) => void;
  updatePlayersAndRounds: (newPlayers: Player[], roundNumber: number, roundUpdates: Partial<Round>) => void;
  getCurrentRound: () => Round | undefined;
  phase: GamePhase; setPhase: (phase: GamePhase) => void;
  gameMode: 'local' | 'online'; setGameMode: (mode: 'local' | 'online') => void;
  roomId: string; setRoomId: (id: string) => void;
  playerId: string; setPlayerId: (id: string) => void;
  isHost: boolean; setIsHost: (isHost: boolean) => void;
  isCompany: boolean;
  currentCompanyName: string;
  currentCompanyId: string;
  advanceToNextRound: (nextRound: Round) => void;
  updateRoundAndPhase: (roundNumber: number, roundUpdates: Partial<Round>, newPhase: GamePhase) => void;
  syncState: (overrides?: Partial<any>) => void;
  sendEvent: (event: string, payload: any) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayersState] = useState<Player[]>([]);
  const [currentRound, setCurrentRoundState] = useState(0);
  const [rounds, setRoundsState] = useState<Round[]>([]);
  const [phase, setPhaseState] = useState<GamePhase>('setup');
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  const channelRef = useRef<any>(null);
  const stateRef = useRef({ isHost, currentRound, players, rounds, phase, gameMode, roomId });
  
  useEffect(() => {
    stateRef.current = { isHost, currentRound, players, rounds, phase, gameMode, roomId };
  }, [isHost, currentRound, players, rounds, phase, gameMode, roomId]);

  const sendEvent = useCallback((event: string, payload: any) => {
    const { gameMode, roomId } = stateRef.current;
    if (gameMode !== 'online' || !roomId || !channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event, payload });
  }, []);

  const syncState = useCallback((overrides: any = {}) => {
    const { gameMode, roomId } = stateRef.current;
    if (gameMode !== 'online' || !roomId || !channelRef.current) return;
    const stateToSync = {
      players: overrides.players ?? stateRef.current.players,
      currentRound: overrides.currentRound ?? stateRef.current.currentRound,
      rounds: overrides.rounds ?? stateRef.current.rounds,
      phase: overrides.phase ?? stateRef.current.phase,
      timestamp: Date.now(),
    };
    sendEvent('state_update', stateToSync);
  }, [sendEvent]);

  useEffect(() => {
    if (gameMode === 'online' && roomId) {
      const channel = supabase.channel(`room-${roomId}`, { config: { broadcast: { self: false } } });
      channel
        .on('broadcast', { event: 'state_update' }, ({ payload }) => {
          if (!stateRef.current.isHost) {
            if (payload.players) setPlayersState(payload.players);
            if (payload.currentRound !== undefined) setCurrentRoundState(payload.currentRound);
            if (payload.rounds) setRoundsState(payload.rounds);
            if (payload.phase) setPhaseState(payload.phase);
          }
        })
        .on('broadcast', { event: 'player_join' }, ({ payload }) => {
          if (stateRef.current.isHost && payload.player && payload.player.id) {
            const existing = stateRef.current.players.find(p => p.id === payload.player.id);
            if (existing) {
              setTimeout(() => syncState(), 50);
              return;
            }
            setPlayersState(prev => {
              const assignedColor = PLAYER_COLORS[prev.length % PLAYER_COLORS.length];
              const newPlayers = [...prev, { ...payload.player, color: assignedColor }];
              setTimeout(() => syncState({ players: newPlayers }), 50);
              return newPlayers;
            });
          }
        })
        .on('broadcast', { event: 'round_update_request' }, ({ payload }) => {
          if (stateRef.current.isHost && payload.roundNumber) {
            setRoundsState(prev => {
              const newRounds = prev.map(r => r.roundNumber === payload.roundNumber ? { ...r, ...payload.updates } : r);
              setTimeout(() => syncState({ rounds: newRounds }), 50);
              return newRounds;
            });
          }
        })
        .on('broadcast', { event: 'phase_update_request' }, ({ payload }) => {
          if (stateRef.current.isHost && payload.phase) {
            setPhaseState(payload.phase);
            setTimeout(() => syncState({ phase: payload.phase }), 50);
          }
        })
        .on('broadcast', { event: 'round_and_phase_update_request' }, ({ payload }) => {
          if (stateRef.current.isHost && payload.roundNumber) {
            setRoundsState(prev => {
              const newRounds = prev.map(r => r.roundNumber === payload.roundNumber ? { ...r, ...payload.roundUpdates } : r);
              setPhaseState(payload.newPhase);
              setTimeout(() => syncState({ rounds: newRounds, phase: payload.newPhase }), 50);
              return newRounds;
            });
          }
        })
        .on('broadcast', { event: 'investment_submit' }, ({ payload }) => {
          if (stateRef.current.isHost && payload.investment) {
            setRoundsState(prev => {
              const targetRound = payload.roundNumber || stateRef.current.currentRound;
              const currentRoundObj = prev.find(r => r.roundNumber === targetRound);
              if (!currentRoundObj) return prev;
              const existingIndex = currentRoundObj.investments.findIndex(i => i.investorId === payload.investment.investorId);
              let newInvestments = existingIndex !== -1 ? [...currentRoundObj.investments] : [...currentRoundObj.investments, payload.investment];
              if (existingIndex !== -1) newInvestments[existingIndex] = payload.investment;
              const newRounds = prev.map(r => r.roundNumber === targetRound ? { ...r, investments: newInvestments } : r);
              setTimeout(() => syncState({ rounds: newRounds }), 50);
              return newRounds;
            });
          }
        })
        .on('broadcast', { event: 'player_ready_next' }, ({ payload }) => {
          if (stateRef.current.isHost && payload.playerId) {
            setRoundsState(prev => {
              const targetRound = payload.roundNumber || stateRef.current.currentRound;
              const currentRoundObj = prev.find(r => r.roundNumber === targetRound);
              if (!currentRoundObj) return prev;
              const readyPlayers = currentRoundObj.readyPlayers || [];
              if (readyPlayers.includes(payload.playerId)) return prev;
              const newReady = [...readyPlayers, payload.playerId];
              const newRounds = prev.map(r => r.roundNumber === targetRound ? { ...r, readyPlayers: newReady } : r);
              setTimeout(() => syncState({ rounds: newRounds }), 50);
              return newRounds;
            });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channelRef.current = channel;
            if (stateRef.current.isHost) syncState();
          }
        });
      return () => { 
        supabase.removeChannel(channel); 
        channelRef.current = null; 
      };
    }
  }, [gameMode, roomId, syncState]);

  const setPlayers = useCallback((newPlayers: Player[]) => {
    setPlayersState(newPlayers);
    if (stateRef.current.gameMode === 'online' && stateRef.current.isHost) {
      syncState({ players: newPlayers });
    }
  }, [syncState]);

  const addRound = useCallback((round: Round) => {
    setRoundsState(prev => {
      const playersList = stateRef.current.players;
      const idx = (round.roundNumber - 1) % (playersList.length || 1);
      const company = playersList[idx];
      const initializedRound: Round = {
        ...round,
        companyId: company?.id || round.companyId,
        companyName: company?.name || round.companyName,
        companyIndex: idx,
        topicConfirmed: false,
        graphCompleted: false,
        rouletteState: { isSpinning: false, displayTopic: '', finalTopic: undefined }
      };
      const newRounds = [...prev, initializedRound];
      setCurrentRoundState(initializedRound.roundNumber);
      if (stateRef.current.gameMode === 'online' && stateRef.current.isHost) {
        setTimeout(() => syncState({ rounds: newRounds, currentRound: initializedRound.roundNumber }), 50);
      }
      return newRounds;
    });
  }, [syncState]);

  const updateRound = useCallback((roundNumber: number, updates: Partial<Round>) => {
    setRoundsState(prev => {
      const newRounds = prev.map(r => r.roundNumber === roundNumber ? { ...r, ...updates } : r);
      if (stateRef.current.gameMode === 'online') {
        if (stateRef.current.isHost) {
          setTimeout(() => syncState({ rounds: newRounds }), 50);
        } else {
          sendEvent('round_update_request', { roundNumber, updates });
        }
      }
      return newRounds;
    });
  }, [syncState, sendEvent]);

  const updatePlayersAndRounds = useCallback((newPlayers: Player[], roundNumber: number, roundUpdates: Partial<Round>) => {
    setPlayersState(newPlayers);
    setRoundsState(prev => {
      const newRounds = prev.map(r => r.roundNumber === roundNumber ? { ...r, ...roundUpdates } : r);
      if (stateRef.current.gameMode === 'online' && stateRef.current.isHost) {
        syncState({ players: newPlayers, rounds: newRounds });
      }
      return newRounds;
    });
  }, [syncState]);

  const updatePlayerPoints = useCallback((pId: string, points: number) => {
    setPlayersState(prev => {
      const newPlayers = prev.map(p => p.id === pId ? { ...p, currentPoint: p.currentPoint + points } : p);
      if (stateRef.current.gameMode === 'online' && stateRef.current.isHost) {
        setTimeout(() => syncState({ players: newPlayers }), 50);
      }
      return newPlayers;
    });
  }, [syncState]);

  const setPhase = useCallback((newPhase: GamePhase) => {
    setPhaseState(newPhase);
    if (stateRef.current.gameMode === 'online') {
      if (stateRef.current.isHost) syncState({ phase: newPhase });
      else sendEvent('phase_update_request', { phase: newPhase });
    }
  }, [syncState, sendEvent]);

  const advanceToNextRound = useCallback((nextRound: Round) => {
    if (!stateRef.current.isHost && stateRef.current.gameMode === 'online') return;

    // すでにそのラウンドが存在する場合は重複を避ける
    const alreadyExists = stateRef.current.rounds.some(r => r.roundNumber === nextRound.roundNumber);
    if (alreadyExists) return;

    setRoundsState(prev => [...prev, nextRound]);
    setCurrentRoundState(nextRound.roundNumber);
    setPhaseState('topic-selection');
    
    // オンラインモードかつホストの場合は同期
    if (stateRef.current.gameMode === 'online' && stateRef.current.isHost) {
      // stateRefが更新されるのを待たず、確実な値で同期する
      const nextRounds = [...stateRef.current.rounds, nextRound];
      setTimeout(() => {
        syncState({ 
          rounds: nextRounds, 
          currentRound: nextRound.roundNumber, 
          phase: 'topic-selection' 
        });
      }, 100);
    }
  }, [syncState]);

  const updateRoundAndPhase = useCallback((roundNumber: number, roundUpdates: Partial<Round>, newPhase: GamePhase) => {
    setRoundsState(prev => {
      const newRounds = prev.map(r => r.roundNumber === roundNumber ? { ...r, ...roundUpdates } : r);
      setPhaseState(newPhase);
      if (stateRef.current.gameMode === 'online') {
        if (stateRef.current.isHost) {
          setTimeout(() => syncState({ rounds: newRounds, phase: newPhase }), 50);
        } else {
          sendEvent('round_and_phase_update_request', { roundNumber, roundUpdates, newPhase });
        }
      }
      return newRounds;
    });
  }, [syncState, sendEvent]);

  const contextValue = useMemo(() => {
    const currentRoundObj = rounds.find(r => r.roundNumber === currentRound);
    let companyId = currentRoundObj?.companyId || '';
    let companyName = currentRoundObj?.companyName || '---';
    
    if (!currentRoundObj && currentRound > 0 && players.length > 0) {
      const idx = (currentRound - 1) % players.length;
      const company = players[idx];
      companyId = company?.id || '';
      companyName = company?.name || '---';
    }

    const isCompanyVal = gameMode === 'local' 
      ? (phase === 'topic-selection' || phase === 'graph-creation') 
      : (!!playerId && !!companyId && playerId === companyId);

    return {
      players,
      currentRound,
      rounds,
      phase,
      gameMode,
      roomId,
      playerId,
      isHost,
      isCompany: isCompanyVal,
      currentCompanyName: companyName,
      currentCompanyId: companyId,
      setPlayers,
      addRound,
      updateRound,
      updatePlayersAndRounds,
      updatePlayerPoints,
      getCurrentRound: () => rounds.find(r => r.roundNumber === currentRound),
      setPhase,
      setGameMode,
      setRoomId,
      setPlayerId,
      setIsHost,
      advanceToNextRound,
      updateRoundAndPhase,
      syncState,
      sendEvent
    };
  }, [
    players, currentRound, rounds, phase, gameMode, roomId, playerId, isHost, 
    setPlayers, addRound, updateRound, updatePlayersAndRounds, 
    updatePlayerPoints, setPhase, advanceToNextRound, updateRoundAndPhase, 
    syncState, sendEvent
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

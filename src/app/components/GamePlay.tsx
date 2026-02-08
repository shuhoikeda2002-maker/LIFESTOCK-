import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { TopicSelection } from './TopicSelection';
import { GraphCreation } from './GraphCreation';
import { QuestionPhase } from './QuestionPhase';
import { InvestmentPhase } from './InvestmentPhase';
import { ResultsRevealPhase } from './ResultsRevealPhase';
import { ResultsPhase } from './ResultsPhase';
import { RoundSummaryPhase } from './RoundSummaryPhase';
import { FinalResults } from './FinalResults';
import { GameHeader } from './GameHeader';

export function GamePlay() {
  const { phase, currentRound, players, addRound, gameMode, isHost } = useGame();

  useEffect(() => {
    // Initialize first round if needed
    // In online mode, only host creates the round
    const shouldAddRound = gameMode === 'local' || (gameMode === 'online' && isHost);
    
    if (shouldAddRound && currentRound === 0 && phase === 'topic-selection') {
      // ユーザー指定の数式: companyIndex = (roundNumber - 1) % プレイヤー数
      // 第1ラウンド (roundNumber: 1) の場合、companyIndex = 0
      if (players.length > 0) {
        const initialCompany = players[0];
        
        addRound({
          roundNumber: 1,
          companyId: initialCompany.id,
          companyIndex: 0,
          companyName: initialCompany.name,
          topic: '',
          anchorPoints: [],
          questions: [],
          investments: [],
          completed: false,
          graphCompleted: false,
          readyPlayers: [],
          rouletteState: {
            isSpinning: false,
            displayTopic: '',
            finalTopic: undefined
          }
        });
      }
    }
  }, [currentRound, phase, players, addRound, gameMode, isHost]);

  return (
    <div className="h-full w-full flex flex-col bg-[#030213] overflow-hidden">
      <GameHeader />
      <div className="flex-1 relative overflow-hidden">
        {phase === 'topic-selection' && <TopicSelection />}
        {phase === 'graph-creation' && <GraphCreation />}
        {phase === 'questions' && <QuestionPhase />}
        {phase === 'investment' && <InvestmentPhase />}
        {phase === 'results-reveal' && <ResultsRevealPhase />}
        {phase === 'results' && <ResultsPhase />}
        {phase === 'round-summary' && <RoundSummaryPhase />}
        {phase === 'final-results' && <FinalResults />}
      </div>
    </div>
  );
}

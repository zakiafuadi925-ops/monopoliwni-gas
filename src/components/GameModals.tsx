import React from 'react';
import {
  BoardTile,
  BreakingNewsEvent,
  DilemmaCard,
  EventOutcomeCard,
  GameLogItem,
  GameMode,
  MacroEconomy,
  MacroHistoryPoint,
  Player,
  PlayerCorruptionHistoryPoint,
} from '../types/game';
import { LawProposal } from '../data/laws';
import { LuxuryLaunderProperty } from '../data/luxuryProperties';
import { SavedGameSnapshot } from '../engine/persistence';
import { TradeOffer } from '../engine/trade';
import { BANNER_IMAGE, CARD_IMAGE, CREST_IMAGE } from '../constants/gameAssets';

import { CardModal } from './CardModal';
import { CorruptionAuditModal, CorruptionGateModal, KPKBribeModal } from './CorruptionModal';
import { ParliamentModal } from './ParliamentModal';
import { BreakingNewsBanner } from './BreakingNewsBanner';
import { PlayerStatsDrawer } from './PlayerStatsDrawer';
import { SetupGameModal } from './SetupGameModal';
import { QuickGuideModal } from './QuickGuideModal';
import { TradeModal } from './TradeModal';
import { MultiplayerLobbyModal } from './MultiplayerLobbyModal';
import { GameOverModal } from './GameOverModal';
import { TileDetailModal } from './TileDetailModal';
import { DrawCardModal } from './DrawCardModal';
import { GameLogsModal } from './GameLogsModal';
import { RentCrisisModal } from './RentCrisisModal';
import { ManualRentPaymentModal, RentTransferData } from './ManualRentPaymentModal';
import { MoneyLaunderingModal } from './MoneyLaunderingModal';

export interface RentCrisisState {
  crisisType?: 'RENT' | 'EVENT_LOSS' | 'TILE_BILL' | 'BIROKRASI' | 'PSYCHOLOGIST' | 'KPK_BRIBE' | 'DEBT';
  payer: Player;
  owner?: Player;
  tile?: BoardTile;
  rentCost?: number;
  amountDue?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  recipientName?: string;
  recipientAvatar?: string;
  recipientColor?: string;
  causeDesc?: string;
  onPaySuccess?: (updatedPayer: Player) => void;
}

export interface DrawCardEventState {
  type: 'MUSIBAH' | 'TAKDIR';
  cardsPool: EventOutcomeCard[];
  targetPlayer: Player;
}

interface GameModalsProps {
  // Core state
  isSetupOpen: boolean;
  isGameOver: boolean;
  gameOverReason: string;
  gameMode: GameMode;
  cycleRound: number;
  players: Player[];
  activePlayer: Player | null;
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  luxuryTiles: BoardTile[];
  macro: MacroEconomy;
  macroHistory: MacroHistoryPoint[];
  corruptionHistory: PlayerCorruptionHistoryPoint[];
  logs: GameLogItem[];

  // Persistence & online
  savedSnapshot: SavedGameSnapshot | null;
  clientId: string;

  // Modal visibility & active data
  showOnlineLobby: boolean;
  showQuickGuide: boolean;
  showTradeModal: boolean;
  activeDilemmaCard: DilemmaCard | null;
  showCorruptionGate: boolean;
  showCorruptionAudit: boolean;
  showKpkBribe: boolean;
  activeDrawCardEvent: DrawCardEventState | null;
  showParliament: boolean;
  showMoneyLaundering: boolean;
  currentNews: BreakingNewsEvent | null;
  isStatsOpen: boolean;
  selectedTile: BoardTile | null;
  showLogsModal: boolean;
  rentCrisis: RentCrisisState | null;
  manualRentData: RentTransferData | null;

  // Close / simple UI setters
  onCloseSetup: () => void;
  onOpenOnlineLobby: () => void;
  onCloseOnlineLobby: () => void;
  onCloseQuickGuide: () => void;
  onCloseTradeModal: () => void;
  onCloseParliament: () => void;
  onDismissNews: () => void;
  onCloseStats: () => void;
  onOpenFullHistoryFromStats: () => void;
  onCloseTileDetail: () => void;
  onCloseLogsModal: () => void;

  // Game action handlers
  onStartGame: (configuredPlayers: Player[], selectedMode?: GameMode) => void;
  onResumeSavedGame: () => void;
  onResumeCloudGame: (snapshot: SavedGameSnapshot, id: string) => void;
  onEnterOnlineGame: (payload: {
    roomCode: string;
    stateVersion: number;
    snapshot: SavedGameSnapshot;
  }) => void;
  onExecuteTrade: (offer: TradeOffer) => void;
  onChooseCardOption: (optionKey: 'optionA' | 'optionB') => void;
  onEnterCorruptionRoute: () => void;
  onStayOnNormalPath: () => void;
  onCorruptionAuditResolve: (caught: boolean) => void;
  onPayKpkBribe: () => void;
  onRefuseKpkBribe: () => void;
  onConfirmDrawCardOutcome: (outcome: {
    card: EventOutcomeCard;
    diceValue: number;
    confiscatedTile: BoardTile | null;
    usedSpecialCardId?: string;
  }) => void;
  onPassLaw: (proposal: LawProposal, coalitionPartner?: Player) => void;
  onVetoLaw: (proposal: LawProposal, vetoingPlayer: Player, usedSpecialCardId?: string) => void;
  onLaunderBuyLuxury: (property: LuxuryLaunderProperty) => void;
  onLaunderBuyPerimeter: (tile: BoardTile, discountedCost: number, kpkRisk: number) => void;
  onSkipLaundering: () => void;
  onRestartNewRound: () => void;
  onQuickRestart: () => void;
  onSellPropertyForRent: (tileId: number, sellValue: number) => void;
  onSellAllPropertiesForRent: (sales: { tileId: number; sellValue: number }[]) => void;
  onPayRentFromCrisis: () => void;
  onBankruptcyFromRentCrisis: () => void;
  onUseSpecialCardForRent: (cardId: string) => void;
  onConfirmManualRentPayment: () => void;
  onUseSpecialCardForManualRent: (cardId: string) => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  isSetupOpen,
  isGameOver,
  gameOverReason,
  gameMode,
  cycleRound,
  players,
  activePlayer,
  perimeterTiles,
  corruptionTiles,
  luxuryTiles,
  macro,
  macroHistory,
  corruptionHistory,
  logs,
  savedSnapshot,
  clientId,
  showOnlineLobby,
  showQuickGuide,
  showTradeModal,
  activeDilemmaCard,
  showCorruptionGate,
  showCorruptionAudit,
  showKpkBribe,
  activeDrawCardEvent,
  showParliament,
  showMoneyLaundering,
  currentNews,
  isStatsOpen,
  selectedTile,
  showLogsModal,
  rentCrisis,
  manualRentData,
  onCloseSetup,
  onOpenOnlineLobby,
  onCloseOnlineLobby,
  onCloseQuickGuide,
  onCloseTradeModal,
  onCloseParliament,
  onDismissNews,
  onCloseStats,
  onOpenFullHistoryFromStats,
  onCloseTileDetail,
  onCloseLogsModal,
  onStartGame,
  onResumeSavedGame,
  onResumeCloudGame,
  onEnterOnlineGame,
  onExecuteTrade,
  onChooseCardOption,
  onEnterCorruptionRoute,
  onStayOnNormalPath,
  onCorruptionAuditResolve,
  onPayKpkBribe,
  onRefuseKpkBribe,
  onConfirmDrawCardOutcome,
  onPassLaw,
  onVetoLaw,
  onLaunderBuyLuxury,
  onLaunderBuyPerimeter,
  onSkipLaundering,
  onRestartNewRound,
  onQuickRestart,
  onSellPropertyForRent,
  onSellAllPropertiesForRent,
  onPayRentFromCrisis,
  onBankruptcyFromRentCrisis,
  onUseSpecialCardForRent,
  onConfirmManualRentPayment,
  onUseSpecialCardForManualRent,
}) => {
  return (
    <>
      {/* 1. Pre-Game Setup Modal */}
      {isSetupOpen && (
        <SetupGameModal
          onStartGame={onStartGame}
          bannerImage={BANNER_IMAGE}
          onClose={players.length > 0 && !isGameOver ? onCloseSetup : undefined}
          savedSnapshot={savedSnapshot}
          onResumeSavedGame={onResumeSavedGame}
          onResumeCloudGame={onResumeCloudGame}
          onOpenOnlineLobby={onOpenOnlineLobby}
        />
      )}

      <MultiplayerLobbyModal
        isOpen={showOnlineLobby}
        clientId={clientId}
        onClose={onCloseOnlineLobby}
        onEnterOnlineGame={onEnterOnlineGame}
      />

      <QuickGuideModal
        isOpen={showQuickGuide}
        onClose={onCloseQuickGuide}
      />

      {/* 1b. Meja Negosiasi & Barter Properti */}
      {showTradeModal && activePlayer && !activePlayer.isBankrupt && (
        <TradeModal
          isOpen={showTradeModal}
          proposer={activePlayer}
          players={players}
          perimeterTiles={perimeterTiles}
          macro={macro}
          onExecuteTrade={onExecuteTrade}
          onClose={onCloseTradeModal}
        />
      )}

      {/* 2. Dilemma & Opportunity Card Modal */}
      {activeDilemmaCard && activePlayer && (
        <CardModal
          card={activeDilemmaCard}
          activePlayer={activePlayer}
          onChooseOption={onChooseCardOption}
          cardImage={CARD_IMAGE}
        />
      )}

      {/* 3. Corruption Route Entrance Gate Modal */}
      {showCorruptionGate && activePlayer && (
        <CorruptionGateModal
          player={activePlayer}
          onEnterCorruptionRoute={onEnterCorruptionRoute}
          onStayOnNormalPath={onStayOnNormalPath}
          crestImage={CREST_IMAGE}
        />
      )}

      {/* 4. Corruption BPK & KPK Audit Modal */}
      {showCorruptionAudit && activePlayer && (
        <CorruptionAuditModal
          player={activePlayer}
          onAuditResolve={onCorruptionAuditResolve}
        />
      )}

      {/* 4b. KPK Bribe Decision Modal */}
      {showKpkBribe && activePlayer && (
        <KPKBribeModal
          player={activePlayer}
          bribeAmount={65_000_000}
          onPayBribe={onPayKpkBribe}
          onRefuseBribe={onRefuseKpkBribe}
        />
      )}

      {/* 4c. Event Musibah & Takdir 3D Draw Card & 3-Tier Dice Outcome Modal */}
      {activeDrawCardEvent && (
        <DrawCardModal
          player={activeDrawCardEvent.targetPlayer}
          eventType={activeDrawCardEvent.type}
          cardsPool={activeDrawCardEvent.cardsPool}
          ownedTiles={perimeterTiles.filter(t =>
            activeDrawCardEvent.targetPlayer.ownedProperties.includes(t.id)
          )}
          onConfirmOutcome={onConfirmDrawCardOutcome}
        />
      )}

      {/* 5. DPR Senayan Parliament Modal */}
      {showParliament && activePlayer && (
        <ParliamentModal
          player={activePlayer}
          players={players}
          onPassLaw={onPassLaw}
          onVetoLaw={onVetoLaw}
          onClose={onCloseParliament}
        />
      )}

      {/* 5b. Money Laundering & Luxury Real Estate in Corruption Route Modal */}
      {showMoneyLaundering && activePlayer && (
        <MoneyLaunderingModal
          player={activePlayer}
          players={players}
          perimeterTiles={perimeterTiles}
          luxuryTiles={luxuryTiles}
          macro={macro}
          onLaunderBuyLuxury={onLaunderBuyLuxury}
          onLaunderBuyPerimeter={onLaunderBuyPerimeter}
          onSkipLaundering={onSkipLaundering}
        />
      )}

      {/* 6. Breaking News Banner Alert */}
      {currentNews && (
        <BreakingNewsBanner
          currentNews={currentNews}
          onDismiss={onDismissNews}
        />
      )}

      {/* 7. Player Statistics & Transparency Drawer */}
      <PlayerStatsDrawer
        players={players}
        tiles={[...perimeterTiles, ...corruptionTiles, ...luxuryTiles]}
        macro={macro}
        macroHistory={macroHistory}
        corruptionHistory={corruptionHistory}
        currentRound={cycleRound}
        logs={logs}
        isOpen={isStatsOpen}
        onClose={onCloseStats}
        activePlayerId={activePlayer?.id || 'player_1'}
        onOpenFullHistory={onOpenFullHistoryFromStats}
      />

      {/* 8. Tile Detail Inspector Modal */}
      {selectedTile && (
        <TileDetailModal
          tile={selectedTile}
          players={players}
          macro={macro}
          onClose={onCloseTileDetail}
        />
      )}

      {/* 9. Full History Logbook & National Archives Modal */}
      <GameLogsModal
        logs={logs}
        players={players}
        macro={macro}
        isOpen={showLogsModal}
        onClose={onCloseLogsModal}
      />

      {/* 10. Game Over & Victory Podium */}
      {isGameOver && (
        <GameOverModal
          players={players}
          tiles={[...perimeterTiles, ...corruptionTiles, ...luxuryTiles]}
          macro={macro}
          onRestart={onRestartNewRound}
          onQuickRestart={onQuickRestart}
          reason={gameOverReason}
          gameMode={gameMode}
          cycleRound={cycleRound}
        />
      )}

      {/* 11. Rent & Financial Crisis Property Liquidation Modal */}
      {rentCrisis && (
        <RentCrisisModal
          isOpen={true}
          payer={rentCrisis.payer}
          owner={rentCrisis.owner}
          tile={rentCrisis.tile}
          rentCost={rentCrisis.rentCost}
          crisisType={rentCrisis.crisisType}
          amountDue={rentCrisis.amountDue}
          title={rentCrisis.title}
          subtitle={rentCrisis.subtitle}
          description={rentCrisis.description}
          recipientName={rentCrisis.recipientName}
          recipientAvatar={rentCrisis.recipientAvatar}
          recipientColor={rentCrisis.recipientColor}
          causeDesc={rentCrisis.causeDesc}
          perimeterTiles={[...perimeterTiles, ...luxuryTiles]}
          macro={macro}
          onSellProperty={onSellPropertyForRent}
          onSellAllProperties={onSellAllPropertiesForRent}
          onPayRent={onPayRentFromCrisis}
          onDeclareBankruptcy={onBankruptcyFromRentCrisis}
          onUseSpecialCard={onUseSpecialCardForRent}
        />
      )}

      {/* 12. Manual Rent Payment Interactive & Animated Modal */}
      {manualRentData && (
        <ManualRentPaymentModal
          data={manualRentData}
          onConfirmPayment={onConfirmManualRentPayment}
          onUseSpecialCard={onUseSpecialCardForManualRent}
        />
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { Player, BoardTile, EventOutcomeCard, SpecialCardItem } from '../types/game';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { 
  AlertTriangle, 
  Sparkles, 
  Dices, 
  Coins, 
  HeartCrack, 
  ShieldAlert, 
  Building2, 
  Check, 
  Flame, 
  Crown,
  Ban,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

interface DrawCardModalProps {
  player: Player;
  eventType: 'MUSIBAH' | 'TAKDIR';
  cardsPool: EventOutcomeCard[];
  ownedTiles: BoardTile[];
  onConfirmOutcome: (outcome: {
    card: EventOutcomeCard;
    diceValue: number;
    confiscatedTile: BoardTile | null;
    usedSpecialCardId?: string;
  }) => void;
}

export const DrawCardModal: React.FC<DrawCardModalProps> = ({
  player,
  eventType,
  cardsPool,
  ownedTiles,
  onConfirmOutcome
}) => {
  // States: 'READY_TO_ROLL' | 'ROLLING' | 'REVEALED'
  const [phase, setPhase] = useState<'READY_TO_ROLL' | 'ROLLING' | 'REVEALED'>('READY_TO_ROLL');
  const [diceNumber, setDiceNumber] = useState<number>(1);
  const [activeCard, setActiveCard] = useState<EventOutcomeCard | null>(null);
  const [selectedConfiscatedTile, setSelectedConfiscatedTile] = useState<BoardTile | null>(null);
  const [protectWithSpecialCard, setProtectWithSpecialCard] = useState<boolean>(false);

  // Check if player has protective special cards
  const protectiveCards = (player.specialCards || []).filter(
    c => c.type === 'ORDAL_SAKTI' || c.type === 'KEBAL_SITA'
  );

  // Auto-roll for AI players after 700ms (ensures AI always rolls for itself)
  useEffect(() => {
    if (player.isAi && phase === 'READY_TO_ROLL') {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [player.isAi, phase]);

  // Auto-confirm for AI players after card is revealed (gives human players 2.2s to observe card & effects)
  useEffect(() => {
    if (player.isAi && phase === 'REVEALED') {
      // If AI has protective card and card confiscates tile or causes heavy loss, activate protection!
      if (protectiveCards.length > 0 && (selectedConfiscatedTile || (activeCard && activeCard.cashChange < -15_000_000))) {
        setProtectWithSpecialCard(true);
      }
      const timer = setTimeout(() => {
        handleFinalConfirm();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [player.isAi, phase, protectiveCards.length, selectedConfiscatedTile, activeCard]);

  const handleRollDice = () => {
    if (phase !== 'READY_TO_ROLL') return;
    setPhase('ROLLING');
    soundManager.playDiceRoll();

    // Roll animation effect
    let rollsCount = 0;
    const interval = setInterval(() => {
      rollsCount++;
      const randNum = Math.floor(Math.random() * 6) + 1;
      setDiceNumber(randNum);

      if (rollsCount > 10) {
        clearInterval(interval);
        // Final roll outcome: 1-6
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceNumber(finalDice);

        // Determine tier based on user requirement:
        // 1 & 2: BERAT
        // 3 & 4: SEDANG
        // 5 & 6: RINGAN
        let tier: 'BERAT' | 'SEDANG' | 'RINGAN';
        if (finalDice <= 2) tier = 'BERAT';
        else if (finalDice <= 4) tier = 'SEDANG';
        else tier = 'RINGAN';

        // Pick matching card from pool
        const matchingCards = cardsPool.filter(c => c.tier === tier);
        const chosenCard = matchingCards.length > 0 
          ? matchingCards[Math.floor(Math.random() * matchingCards.length)]
          : cardsPool[0];

        setActiveCard(chosenCard);

        // If card confiscates land deed and player owns any
        if (chosenCard.confiscatesLandDeed && ownedTiles.length > 0) {
          const victimTile = ownedTiles[Math.floor(Math.random() * ownedTiles.length)];
          setSelectedConfiscatedTile(victimTile);
        } else {
          setSelectedConfiscatedTile(null);
        }

        // Sound effect on reveal
        setTimeout(() => {
          setPhase('REVEALED');
          soundManager.playCardDraw();
          if (eventType === 'MUSIBAH') {
            if (tier === 'BERAT') soundManager.playSirenOTT();
            else soundManager.playBuzzer();
          } else {
            soundManager.playVictory();
          }
        }, 300);
      }
    }, 80);
  };

  const handleFinalConfirm = () => {
    if (!activeCard) return;

    let confiscated = selectedConfiscatedTile;
    let usedCardId: string | undefined = undefined;

    // AI auto-protect check or user selected protection
    const shouldProtect = protectWithSpecialCard || (
      player.isAi && 
      protectiveCards.length > 0 && 
      (selectedConfiscatedTile || activeCard.cashChange < -15_000_000)
    );

    if (shouldProtect && protectiveCards.length > 0) {
      usedCardId = protectiveCards[0].id;
      confiscated = null; // Saved by special card!
    }

    onConfirmOutcome({
      card: activeCard,
      diceValue: diceNumber,
      confiscatedTile: confiscated,
      usedSpecialCardId: usedCardId
    });
  };

  const isMusibah = eventType === 'MUSIBAH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className={`max-w-xl w-full bg-slate-900 border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto ${
        isMusibah ? 'border-rose-600 shadow-rose-950/60' : 'border-amber-500 shadow-amber-950/60'
      }`}>
        {/* Top Header Banner */}
        <div className={`px-4 py-3 flex items-center justify-between border-b ${
          isMusibah ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-800/80' : 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-800/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-lg shrink-0 ${
              isMusibah ? 'bg-rose-900/60 text-rose-400 border border-rose-700' : 'bg-amber-900/60 text-amber-400 border border-amber-700'
            }`}>
              {isMusibah ? <Flame className="w-5 h-5 text-rose-400 animate-pulse" /> : <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />}
            </div>
            <div>
              <span className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider block ${
                isMusibah ? 'text-rose-400' : 'text-amber-400'
              }`}>
                HAL TAK TERDUGA · KARTU {isMusibah ? 'MUSIBAH' : 'TAKDIR'} WNI {player.isAi ? '(GILIRAN BOT AI)' : ''}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                {player.isAi ? `🤖 [AI] ${player.name}` : player.name}: {isMusibah ? 'Uji Ketahanan Bencana' : 'Uji Nasib & Keberuntungan'}
              </h3>
            </div>
          </div>

          {/* Player avatar badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0"
            style={{ borderColor: player.color, backgroundColor: `${player.color}20` }}
          >
            <span>{player.avatar}</span>
            <span className="hidden sm:inline text-white">{player.name} {player.isAi ? '(AI)' : ''}</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-5 space-y-4">
          {/* STEP 1: Dice Rule Guidance Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 sm:p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Dices className="w-4 h-4 text-amber-400" />
                SISTEM KOCOK DADU NASIB (3 TINGKATAN KELAS):
              </span>
              <span className="font-mono text-slate-500">Angka 1 s/d 6</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] sm:text-xs font-mono">
              {/* Tier 1 */}
              <div className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                diceNumber <= 2 && phase !== 'READY_TO_ROLL'
                  ? isMusibah ? 'bg-rose-950 border-rose-500 text-rose-200 ring-2 ring-rose-500' : 'bg-amber-950 border-amber-400 text-amber-200 ring-2 ring-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                <div className="font-black text-xs sm:text-sm">🎲 1 - 2</div>
                <div className={`font-bold mt-0.5 uppercase ${isMusibah ? 'text-rose-400' : 'text-amber-400'}`}>
                  {isMusibah ? 'PALING BERAT' : 'BERKAH AKBAR'}
                </div>
                <div className="text-[9px] text-slate-400 hidden sm:block">
                  {isMusibah ? 'Sita Tanah / Denda Gede' : 'Ganti Untung PSN / Warisan'}
                </div>
              </div>

              {/* Tier 2 */}
              <div className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                diceNumber >= 3 && diceNumber <= 4 && phase !== 'READY_TO_ROLL'
                  ? isMusibah ? 'bg-orange-950 border-orange-500 text-orange-200 ring-2 ring-orange-500' : 'bg-yellow-950 border-yellow-400 text-yellow-200 ring-2 ring-yellow-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                <div className="font-black text-xs sm:text-sm">🎲 3 - 4</div>
                <div className="font-bold mt-0.5 text-yellow-400 uppercase">
                  SEDANG
                </div>
                <div className="text-[9px] text-slate-400 hidden sm:block">
                  {isMusibah ? 'Sengketa BPN / Banjir' : 'Hibah UMKM / Tender'}
                </div>
              </div>

              {/* Tier 3 */}
              <div className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                diceNumber >= 5 && phase !== 'READY_TO_ROLL'
                  ? 'bg-sky-950 border-sky-400 text-sky-200 ring-2 ring-sky-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                <div className="font-black text-xs sm:text-sm">🎲 5 - 6</div>
                <div className="font-bold mt-0.5 text-sky-400 uppercase">
                  RINGAN
                </div>
                <div className="text-[9px] text-slate-400 hidden sm:block">
                  {isMusibah ? 'Macet Tol / Tilang ETLE' : 'Undian Bank / Diskon'}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: The 3D Visual Draw Card Component */}
          <div className="relative min-h-[220px] flex items-center justify-center">
            {phase === 'READY_TO_ROLL' && (
              <div className="text-center p-6 bg-slate-950/80 border-2 border-dashed border-slate-800 rounded-2xl w-full flex flex-col items-center justify-center space-y-4">
                {/* Card Back Graphic */}
                <div className="w-36 h-48 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-amber-500/60 rounded-xl shadow-2xl flex flex-col items-center justify-center p-3 text-center transform hover:scale-105 transition-transform duration-300 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full border border-amber-400/60 flex items-center justify-center text-xl bg-amber-500/10 mb-2 group-hover:rotate-12 transition-transform">
                    {isMusibah ? '🦅' : '🏛️'}
                  </div>
                  <span className="text-[9px] font-mono font-black text-amber-400 tracking-wider uppercase">
                    KARTU RAHASIA
                  </span>
                  <span className="text-[11px] font-extrabold text-white leading-tight mt-1">
                    {isMusibah ? 'MUSIBAH WNI' : 'TAKDIR NUSANTARA'}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono mt-2">
                    Lempar Dadu untuk Buka
                  </span>
                </div>

                <div>
                  <button
                    onClick={handleRollDice}
                    className={`min-h-[46px] py-2.5 px-6 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                      isMusibah
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/60'
                    }`}
                  >
                    <Dices className="w-5 h-5 animate-spin" />
                    <span>
                      {player.isAi 
                        ? `🤖 [AI: ${player.name}] Mengacak Dadu... (Klik Cepat)`
                        : '🎲 Lempar Dadu & Buka Kartu Sekarang!'}
                    </span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Tingkat keparahan / keberuntungan ditentukan oleh angka dadu (1-6).
                  </p>
                </div>
              </div>
            )}

            {phase === 'ROLLING' && (
              <div className="text-center p-8 bg-slate-950/90 rounded-2xl w-full border border-slate-800 flex flex-col items-center justify-center space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-white flex items-center justify-center text-4xl font-mono font-black text-slate-950 shadow-2xl animate-bounce">
                  {diceNumber}
                </div>
                <h4 className="text-sm font-extrabold text-white animate-pulse">
                  Mengocok Dadu Takdir...
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Menentukan hasil kategori kartu...
                </p>
              </div>
            )}

            {phase === 'REVEALED' && activeCard && (
              <div className={`w-full rounded-2xl border-2 p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-300 ${
                isMusibah 
                  ? 'bg-slate-900 border-rose-600/90 shadow-rose-950/60' 
                  : 'bg-slate-900 border-amber-500/90 shadow-amber-950/60'
              }`}>
                {/* Card Top Pill & Roll Result */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl">{activeCard.icon}</span>
                    <div>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        isMusibah ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {activeCard.categoryBadge}
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                        {activeCard.title}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Dadu Keluar:
                    </span>
                    <span className={`text-sm sm:text-base font-mono font-black px-2 py-0.5 rounded-lg border ${
                      isMusibah ? 'bg-rose-900/50 text-rose-300 border-rose-700' : 'bg-amber-900/50 text-amber-300 border-amber-700'
                    }`}>
                      🎲 {diceNumber} ({activeCard.tier})
                    </span>
                  </div>
                </div>

                {/* Headline Banner */}
                <div className={`p-2.5 sm:p-3 rounded-xl border text-center ${
                  isMusibah ? 'bg-rose-950/60 border-rose-700/80' : 'bg-amber-950/60 border-amber-700/80'
                }`}>
                  <h3 className={`text-xs sm:text-sm font-black tracking-wide ${
                    isMusibah ? 'text-rose-200' : 'text-amber-200'
                  }`}>
                    {activeCard.headline}
                  </h3>
                </div>

                {/* Narrative Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  {activeCard.description}
                </p>

                {/* Impact / Consequences Box */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Konsekuensi Terhadap Pemain:
                  </span>

                  {/* Land Deed Confiscation Status */}
                  {activeCard.confiscatesLandDeed && (
                    selectedConfiscatedTile ? (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-rose-300 font-bold flex items-center gap-1.5">
                            <Ban className="w-4 h-4 text-rose-400" />
                            SURAT TANAH RESMI DIRAMPAS OLEH NEGARA:
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-rose-200">
                            Dicabut & Disita BPN
                          </span>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-rose-900/60 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <strong className="text-white block">
                                {selectedConfiscatedTile.certificateTitle || selectedConfiscatedTile.name}
                              </strong>
                              <span className="text-[10px] text-slate-400">
                                {selectedConfiscatedTile.cityName || selectedConfiscatedTile.shortName} ({selectedConfiscatedTile.islandName})
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-rose-400 shrink-0">
                            LELANG PSN
                          </span>
                        </div>

                        {/* Special Card Protection Option! */}
                        {protectiveCards.length > 0 && (
                          <div className="pt-1.5 border-t border-rose-900/60">
                            <label className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-600/80 rounded-lg cursor-pointer hover:bg-emerald-950/60 transition-colors">
                              <input 
                                type="checkbox"
                                checked={protectWithSpecialCard}
                                onChange={(e) => setProtectWithSpecialCard(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                              />
                              <div className="text-[11px] text-slate-200">
                                <span className="font-bold text-emerald-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Gunakan {protectiveCards[0].title}!
                                </span>
                                <span className="text-[10px] text-slate-300 block">
                                  Batalkan perampasan tanah ini menggunakan kartu khusus milikmu.
                                </span>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-1 text-xs">
                        <div className="text-amber-300 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Tidak Memiliki Surat Tanah untuk Disita!
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Karena belum memiliki Surat Tanah, negara membebankan Denda Sita Kas Darurat sebesar <strong className="text-rose-400">{formatRupiah(Math.abs(activeCard.cashChange))}</strong>.
                        </p>
                      </div>
                    )
                  )}

                  {/* Cash & Stress Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {/* Cash Change */}
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Kas:</span>
                      <span className={`font-black ${
                        activeCard.cashChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {activeCard.cashChange > 0 ? `+${formatRupiah(activeCard.cashChange)}` : formatRupiah(activeCard.cashChange)}
                      </span>
                    </div>

                    {/* Stress Change */}
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Stres Mental:</span>
                      <span className={`font-black ${
                        activeCard.stressChange > 0 ? 'text-rose-400' : 'text-sky-400'
                      }`}>
                        {activeCard.stressChange > 0 ? `+${activeCard.stressChange}%` : `${activeCard.stressChange}%`}
                      </span>
                    </div>

                    {/* Political Points */}
                    {activeCard.politicalChange && (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between col-span-2">
                        <span className="text-slate-400 text-[11px]">Pengaruh Politik:</span>
                        <span className="font-black text-amber-300">
                          +{activeCard.politicalChange} Poin
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Special Reward Card (if applicable) */}
                  {activeCard.specialRewardCard && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/50 via-yellow-950/30 to-amber-950/50 border border-amber-500/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{activeCard.specialRewardCard.icon}</span>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                            BONUS KARTU KHUSUS DIDAPAT!
                          </span>
                          <strong className="text-white text-xs">
                            {activeCard.specialRewardCard.title}
                          </strong>
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            {activeCard.specialRewardCard.effectText}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-black text-[10px] shrink-0">
                        SIMPAN
                      </span>
                    </div>
                  )}
                </div>

                {/* Final Action Button */}
                <button
                  onClick={handleFinalConfirm}
                  className={`w-full min-h-[46px] py-2.5 px-4 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                    isMusibah
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {player.isAi ? (
                      `🤖 ${player.name} Memproses Hasil... (Klik Lanjut Cepat)`
                    ) : isMusibah ? (
                      protectWithSpecialCard ? 'Gunakan Kartu Sakti & Lanjutkan' : 'Terima Putusan Negara & Lanjutkan'
                    ) : (
                      'Ambil Rezeki Takdir & Lanjutkan Permainan'
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

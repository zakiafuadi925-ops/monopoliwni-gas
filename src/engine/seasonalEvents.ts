import { MacroEconomy, Player } from '../types/game';
import { computeMacroTrend } from './economy';

export interface SeasonalEvent {
  id: string;
  monthIndex: number;
  title: string;
  icon: string;
  description: string;
  effectSummary: string;
}

export const SEASONAL_EVENTS: Record<number, SeasonalEvent> = {
  3: {
    id: 'lapor_spt_maret',
    monthIndex: 3,
    title: 'Batas Akhir Lapor SPT Pajak Tahunan',
    icon: '🧾',
    description:
      'Server DJP E-Filing kebanjiran akses menjelang 31 Maret. Semua wajib pajak harus menyetor biaya administrasi & konsultan pajak.',
    effectSummary: 'Seluruh penyintas: -Rp 5.000.000 & +8% Stres'
  },
  4: {
    id: 'mudik_thr_lebaran',
    monthIndex: 4,
    title: 'Musim Mudik & Banjir Konsumsi THR Lebaran',
    icon: '🕌',
    description:
      'Perputaran uang tunai melonjak di seluruh daerah saat tradisi mudik dan pencairan THR. Omzet usaha naik namun harga kebutuhan ikut terdongkrak.',
    effectSummary: 'Seluruh penyintas: +Rp 10.000.000, -5% Stres · Inflasi +0.6%'
  },
  8: {
    id: 'hut_kemerdekaan_ri',
    monthIndex: 8,
    title: 'Pesta Rakyat & Bantuan Tunai Kemerdekaan RI',
    icon: '🇮🇩',
    description:
      'Semarak lomba 17-an dan diskon belanja nasional meredakan tekanan hidup masyarakat serta menggerakkan ekonomi mikro.',
    effectSummary: 'Seluruh penyintas: +Rp 8.000.000 & -12% Stres'
  },
  11: {
    id: 'musim_kampanye_pilkada',
    monthIndex: 11,
    title: 'Musim Kampanye & Tahun Politik Daerah',
    icon: '🗳️',
    description:
      'Baliho raksasa bertebaran dan lobi fraksi makin panas. Pengaruh politik mudah diraih, tetapi pengawasan aliran dana aparat ikut mengetat.',
    effectSummary: 'Seluruh penyintas: +12 Pengaruh Politik & +8% Radar KPK'
  },
  12: {
    id: 'tutup_buku_nataru',
    monthIndex: 12,
    title: 'Tutup Buku APBN & Lonjakan Libur Nataru',
    icon: '🎆',
    description:
      'Kejar serapan anggaran akhir tahun! Pemilik ≥ 3 properti meraup proyek kilat, sementara pemain lain menanggung lonjakan biaya liburan akhir tahun.',
    effectSummary: 'Punya ≥ 3 properti: +Rp 15.000.000 · Lainnya: -Rp 4.000.000 & +8% Stres'
  }
};

export interface SeasonalEventResult {
  event: SeasonalEvent | null;
  nextPlayers: Player[];
  nextMacro: MacroEconomy;
  logMessage: string | null;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

/**
 * Menerapkan dampak Event Nasional Musiman ketika memasuki bulan baru tertentu.
 */
export function applySeasonalEvent(
  monthIndex: number,
  players: Player[],
  macro: MacroEconomy
): SeasonalEventResult {
  const event = SEASONAL_EVENTS[monthIndex] ?? null;
  if (!event) {
    return {
      event: null,
      nextPlayers: players,
      nextMacro: macro,
      logMessage: null
    };
  }

  let nextMacro = { ...macro };
  const nextPlayers = players.map(player => {
    if (player.isBankrupt) return player;

    switch (monthIndex) {
      case 3:
        return {
          ...player,
          cash: Math.max(0, player.cash - 5_000_000),
          stress: clamp(player.stress + 8, 0, 100)
        };
      case 4:
        return {
          ...player,
          cash: player.cash + 10_000_000,
          stress: clamp(player.stress - 5, 0, 100)
        };
      case 8:
        return {
          ...player,
          cash: player.cash + 8_000_000,
          stress: clamp(player.stress - 12, 0, 100)
        };
      case 11:
        return {
          ...player,
          politicalInfluence: clamp(player.politicalInfluence + 12, 0, 100),
          kpkSuspicionLevel: clamp(player.kpkSuspicionLevel + 8, 0, 100)
        };
      case 12: {
        if (player.ownedProperties.length >= 3) {
          return {
            ...player,
            cash: player.cash + 15_000_000
          };
        }
        return {
          ...player,
          cash: Math.max(0, player.cash - 4_000_000),
          stress: clamp(player.stress + 8, 0, 100)
        };
      }
      default:
        return player;
    }
  });

  if (monthIndex === 4) {
    const bumpedInflation = Number((macro.inflationRate + 0.6).toFixed(1));
    nextMacro = {
      ...macro,
      inflationRate: bumpedInflation,
      trend: computeMacroTrend(bumpedInflation, 0.6)
    };
  }

  return {
    event,
    nextPlayers,
    nextMacro,
    logMessage: `${event.icon} EVENT NASIONAL (${event.title}): ${event.effectSummary}`
  };
}

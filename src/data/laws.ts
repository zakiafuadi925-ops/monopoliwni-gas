export interface LawProposal {
  id: string;
  title: string;
  requiredInfluence: number;
  description: string;
  effectType: 'ANTI_KPK' | 'LUXURY_TAX' | 'UMKM_SUBSIDY' | 'FREE_PARKING' | 'BANSOS_ORDAL';
  icon: string;
  fluff: string;
}

export const LAW_PROPOSALS: LawProposal[] = [
  {
    id: 'uu_anti_kpk',
    title: 'RUU Pelemahan Wewenang Penyadapan KPK',
    requiredInfluence: 45,
    effectType: 'ANTI_KPK',
    icon: '🛡️',
    description: 'Mengharuskan izin dewan pengawas sebelum OTT. Risiko tertangkap KPK turun 50% bagi Anda!',
    fluff: '"Demi menjaga hak asasi dan kepastian hukum para pengusaha dermawan."'
  },
  {
    id: 'uu_pajak_mewah',
    title: 'RUU Pajak Kekayaan Ekstra & Jet Pribadi',
    requiredInfluence: 50,
    effectType: 'LUXURY_TAX',
    icon: '💰',
    description: 'Mewajibkan pemain lawan yang memiliki kas > Rp 80 Juta membayar pajak 15% yang ditransfer langsung ke kas Anda!',
    fluff: '"Pemerataan ekonomi berkeadilan sosial bagi kawan satu fraksi."'
  },
  {
    id: 'uu_umkm_subsidi',
    title: 'RUU Insentif Usaha & Monopoli Pasar',
    requiredInfluence: 40,
    effectType: 'UMKM_SUBSIDY',
    icon: '🏪',
    description: 'Memberikan subsidi negara yang melipatgandakan sewa seluruh properti milik Anda sebesar +35% selama 3 putaran.',
    fluff: '"Mendongkrak daya saing ekonomi mikro melalui proteksi regulasi."'
  },
  {
    id: 'uu_bebas_pungli',
    title: 'RUU Plat Khusus Kebal Razia & Parkir',
    requiredInfluence: 35,
    effectType: 'FREE_PARKING',
    icon: '🚗',
    description: 'Dapatkan plat dinas RF / ZZ sakti. Anda kebal dari denda Razia, Uji Emisi, dan Tukang Parkir Liar!',
    fluff: '"Sirene strobo menyala, jalan raya milik bersama tapi kami yang diprioritaskan."'
  },
  {
    id: 'uu_bansos_ordal',
    title: 'RUU Alokasi Dana Aspirasi Dapil',
    requiredInfluence: 40,
    effectType: 'BANSOS_ORDAL',
    icon: '📦',
    description: 'Kucurkan dana aspirasi APBN langsung ke rekening Anda sebesar Rp 45.000.000 secara tunai.',
    fluff: '"Penyerapan anggaran belanja daerah demi kemaslahatan konstituen terpilih."'
  }
];

export const BREAKING_NEWS_TEMPLATES = [
  {
    id: 'ppn_12',
    headline: 'BREAKING NEWS: Kenaikan PPN 12% Resmi Berlaku Hari Ini!',
    detail: 'Daya beli masyarakat tertekan. Inflasi melonjak +2.5% dan harga sewa properti naik serentak.',
    impactType: 'INFLATION' as const,
    impactSummary: 'Inflasi +2.5% · Biaya sewa seluruh properti meningkat.'
  },
  {
    id: 'reshuffle_kabinet',
    headline: 'BREAKING NEWS: Reshuffle Kabinet Kilat di Istana Negara!',
    detail: 'Menteri Koordinator diganti. Fluktuasi suku bunga acuan BI naik +0.75% menahan pelarian modal.',
    impactType: 'INFLATION' as const,
    impactSummary: 'BI Rate naik +0.75% · Tagihan pengeluaran bertambah.'
  },
  {
    id: 'ott_serentak',
    headline: 'BREAKING NEWS: KPK Gelar Operasi Tangkap Tangan Serentak!',
    detail: 'Penyidik menyegel sejumlah kantor dinas rekanan proyek. Seluruh pemain di Rute Korupsi dalam bahaya besar.',
    impactType: 'CORRUPTION_CRACKDOWN' as const,
    impactSummary: 'Pengawasan OTT diperketat · Radar KPK seluruh pemain +20%!'
  },
  {
    id: 'subsidi_bbm_dibatasi',
    headline: 'BREAKING NEWS: Kuota Pertalite Dibatasi Hanya Untuk Motor Tertentu!',
    detail: 'Antrean SPBU mengular 2 kilometer. Seluruh pemain terkena stres tambahan +15% akibat macet bensin.',
    impactType: 'SUBSIDY_CUT' as const,
    impactSummary: 'Stres seluruh pemain naik +15% · Biaya hidup meningkat.'
  },
  {
    id: 'server_pdn_down',
    headline: 'BREAKING NEWS: Server Pusat Data Nasional Eror Password Default!',
    detail: 'Layanan publik lumpuh total. Kantor Kelurahan dan Dukcapil macet parah.',
    impactType: 'TAX' as const,
    impactSummary: 'Birokrasi kacau · Biaya pengurusan dokumen naik 2x lipat.'
  }
];

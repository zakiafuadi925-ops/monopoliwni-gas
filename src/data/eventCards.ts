import { EventOutcomeCard, SpecialCardItem } from '../types/game';

// Collectible / Usable Special Perk Cards
export const SPECIAL_CARDS: Record<string, SpecialCardItem> = {
  ORDAL_SAKTI: {
    id: 'ordal_sakti',
    type: 'ORDAL_SAKTI',
    title: 'Surat Sakti Orang Dalam (Ordal)',
    icon: '🎟️',
    description: 'Surat rekomendasi rahasia pejabat tinggi ring-1 istana.',
    effectText: 'Bisa dipakai untuk membatalkan 1 kali perampasan tanah BPN ATAU langsung lolos dari OTT KPK tanpa uang suap!'
  },
  KEBAL_SITA: {
    id: 'kebal_sita',
    type: 'KEBAL_SITA',
    title: 'Sertifikat Hak Milik Kebal Sita BPN',
    icon: '🛡️',
    description: 'Dokumen legalitas tanah berstempel garuda emas bebas klaim tumpang tindih.',
    effectText: 'Kebal dari segala bentuk perampasan tanah oleh Satgas Negara atau proyek PSN!'
  },
  AMNESTI_PAJAK: {
    id: 'amnesti_pajak',
    type: 'AMNESTI_PAJAK',
    title: 'Surat Amnesti Pajak Presiden RI',
    icon: '📜',
    description: 'Pengampunan dosa keuangan resmi dari Kementerian Keuangan.',
    effectText: 'Menghapus Radar KPK menjadi 0% seketika dan memulihkan stres -30%!'
  }
};

// 3-Tier Outcome Cards for MUSIBAH (Catastrophic / Severe, Moderate, Mild)
export const MUSIBAH_EVENT_CARDS: EventOutcomeCard[] = [
  // --- TIER BERAT (Dadu 1 & 2) ---
  {
    id: 'musibah_psn_eksekusi',
    eventType: 'MUSIBAH',
    tier: 'BERAT',
    diceRange: [1, 2],
    diceRangeText: 'Dadu 1 - 2 (Paling Berat)',
    title: 'Penertiban Lahan PSN Tanpa Kompensasi',
    headline: 'SURAT TANAH RESMI DICABUT & DIRAMPAS NEGARA!',
    categoryBadge: 'KATASTROPIK & SITA NEGARA',
    description: 'Ketetapan darurat Proyek Strategis Nasional (PSN) mengeksekusi lahan milikmu! Satgas BPN mencabut hak milik tanah demi kepentingan umum tanpa ganti rugi.',
    confiscatesLandDeed: true,
    cashChange: -25_000_000, // Denda jika tidak punya tanah
    stressChange: 30,
    kpkChange: 15,
    icon: '⚠️'
  },
  {
    id: 'musibah_satgas_blbi',
    eventType: 'MUSIBAH',
    tier: 'BERAT',
    diceRange: [1, 2],
    diceRangeText: 'Dadu 1 - 2 (Paling Berat)',
    title: 'Operasi Sita Eksekusi Satgas Penertiban Aset',
    headline: 'PENYEGELAN ASET & PEMBEKUAN REKENING DARURAT!',
    categoryBadge: 'PENEGAKAN HUKUM EKSTREM',
    description: 'Nama Anda terseret dalam daftar debitur bermasalah! Satgas Negara memasang plang penyitaan tanah atau membekukan kas darurat untuk kas negara.',
    confiscatesLandDeed: true,
    cashChange: -30_000_000, // Denda jika tidak punya tanah
    stressChange: 35,
    kpkChange: 20,
    icon: '🚨'
  },

  // --- TIER SEDANG (Dadu 3 & 4) ---
  {
    id: 'musibah_mafia_tanah',
    eventType: 'MUSIBAH',
    tier: 'SEDANG',
    diceRange: [3, 4],
    diceRangeText: 'Dadu 3 - 4 (Musibah Sedang)',
    title: 'Sengketa Sertifikat Ganda Mafia Tanah',
    headline: 'GUGATAN SENGKETA LAHAN DI PENGADILAN (PTUN)!',
    categoryBadge: 'SENGKETA HUKUM PERDATA',
    description: 'Muncul klaim sertifikat tandingan dari mafia tanah! Anda harus menyewa pengacara senior dan melunasi biaya perkara sengketa pengadilan agar sertifikat tidak diblokir.',
    confiscatesLandDeed: false,
    cashChange: -12_000_000,
    stressChange: 20,
    icon: '⚖️'
  },
  {
    id: 'musibah_banjir_bandang',
    eventType: 'MUSIBAH',
    tier: 'SEDANG',
    diceRange: [3, 4],
    diceRangeText: 'Dadu 3 - 4 (Musibah Sedang)',
    title: 'Bencana Banjir Bandang & Tanggul Jebol',
    headline: 'KERUSAKAN PROPERTI & RETRIBUSI BENCANA!',
    categoryBadge: 'BENCANA ALAM DAERAH',
    description: 'Curah hujan ekstrem menjebol tanggul sungai! Aset properti Anda terendam lumpur setinggi 2 meter. Butuh renovasi darurat dan pembersihan instan.',
    confiscatesLandDeed: false,
    cashChange: -10_000_000,
    stressChange: 15,
    icon: '🌊'
  },
  {
    id: 'musibah_audit_pajak',
    eventType: 'MUSIBAH',
    tier: 'SEDANG',
    diceRange: [3, 4],
    diceRangeText: 'Dadu 3 - 4 (Musibah Sedang)',
    title: 'Pemeriksaan Pajak Khusus & Denda Pembukuan',
    headline: 'SURAT TAGIHAN PAJAK (STP) KURANG BAYAR!',
    categoryBadge: 'FISKAL & AUDIT DAERAH',
    description: 'KPP Pratama menerbitkan surat ketetapan pajak kurang bayar plus denda administrasi bunga berjalan yang harus dilunasi dalam 7 hari kerja.',
    confiscatesLandDeed: false,
    cashChange: -8_000_000,
    stressChange: 15,
    icon: '📑'
  },

  // --- TIER RINGAN (Dadu 5 & 6) ---
  {
    id: 'musibah_macet_pantura',
    eventType: 'MUSIBAH',
    tier: 'RINGAN',
    diceRange: [5, 6],
    diceRangeText: 'Dadu 5 - 6 (Musibah Ringan)',
    title: 'Macet Horor 8 Jam di Jalur Tol Trans-Pulau',
    headline: 'STUCK MACET TOTAL & DEREK DARURAT!',
    categoryBadge: 'LOGISTIK & PERJALANAN',
    description: 'Truk tronton terguling menutup kedua ruas jalan tol utama! Terjebak macet 8 jam tanpa toilet, mesin overheat, dan harus membayar jasa derek liar.',
    confiscatesLandDeed: false,
    cashChange: -3_000_000,
    stressChange: 10,
    icon: '🚗'
  },
  {
    id: 'musibah_tilang_etle',
    eventType: 'MUSIBAH',
    tier: 'RINGAN',
    diceRange: [5, 6],
    diceRangeText: 'Dadu 5 - 6 (Musibah Ringan)',
    title: 'Razia Uji Emisi & Tilang Elektronik ETLE',
    headline: 'SURAT TILANG KAMERA ETLE BERLAPIS!',
    categoryBadge: 'LALU LINTAS KOTA',
    description: 'Terekam kamera ETLE tidak memakai sabuk dan lolos razia uji emisi asap tebal. Denda sidang tilang terpadu langsung memotong saldo tabungan.',
    confiscatesLandDeed: false,
    cashChange: -2_000_000,
    stressChange: 5,
    icon: '📸'
  },
  {
    id: 'musibah_mati_lampu',
    eventType: 'MUSIBAH',
    tier: 'RINGAN',
    diceRange: [5, 6],
    diceRangeText: 'Dadu 5 - 6 (Musibah Ringan)',
    title: 'Pemadaman Bergilir PLN & Korsleting Genset',
    headline: 'BLACKOUT 12 JAM & RUGI OPERASIONAL!',
    categoryBadge: 'INFRASTRUKTUR',
    description: 'Gardu trafo meledak memicu mati lampu berjam-jam. Genset kantor korsleting dan makanan di lemari es basi. Biaya operasional darurat terbuang sia-sia.',
    confiscatesLandDeed: false,
    cashChange: -2_500_000,
    stressChange: 8,
    icon: '⚡'
  }
];

// 3-Tier Outcome Cards for TAKDIR (Mega Windfall, Moderate Grant, Mild Daily Fortune)
export const TAKDIR_EVENT_CARDS: EventOutcomeCard[] = [
  // --- TIER BERAT / ISTIMEWA (Dadu 1 & 2) ---
  {
    id: 'takdir_ganti_untung_psn',
    eventType: 'TAKDIR',
    tier: 'BERAT',
    diceRange: [1, 2],
    diceRangeText: 'Dadu 1 - 2 (Rezeki Terbesar)',
    title: 'Ganti Untung Trase Tol Trans-Pulau (3x Lipat!)',
    headline: 'PEMBEBASAN LAHAN JALAN TOL CAIR FANTASTIS!',
    categoryBadge: 'REZEKI AKBAR NASIONAL',
    description: 'Negara menetapkan trase jalan tol dan kawasan industri persis melintasi titik strategis Anda! Ganti untung kompensasi APBN cair instan berlipat ganda!',
    confiscatesLandDeed: false,
    cashChange: 35_000_000,
    stressChange: -30,
    politicalChange: 20,
    specialRewardCard: SPECIAL_CARDS.KEBAL_SITA,
    icon: '🛣️'
  },
  {
    id: 'takdir_warisan_sultan',
    eventType: 'TAKDIR',
    tier: 'BERAT',
    diceRange: [1, 2],
    diceRangeText: 'Dadu 1 - 2 (Rezeki Terbesar)',
    title: 'Warisan Sultan & Hibah Yayasan Keraton',
    headline: 'DOKUMEN HARTA KELUARGA BESAR DITEMUKAN!',
    categoryBadge: 'WARISAN SULTAN',
    description: 'Ditemukan silsilah sah tanah ulayat dan aset konsorsium keluarga besar! Dana hibah bagi hasil tunai dicairkan tanpa potongan pajak plus mendapat beking ordal!',
    confiscatesLandDeed: false,
    cashChange: 40_000_000,
    stressChange: -35,
    politicalChange: 15,
    specialRewardCard: SPECIAL_CARDS.ORDAL_SAKTI,
    icon: '👑'
  },

  // --- TIER SEDANG (Dadu 3 & 4) ---
  {
    id: 'takdir_hibah_umkm',
    eventType: 'TAKDIR',
    tier: 'SEDANG',
    diceRange: [3, 4],
    diceRangeText: 'Dadu 3 - 4 (Takdir Sedang)',
    title: 'Suntikan Hibah Stimulus UMKM Berdikari',
    headline: 'CAIR DANA HIBAH USAHA NON-BUNGA!',
    categoryBadge: 'STIMULUS EKONOMI',
    description: 'Usaha Anda terpilih sebagai pilot project kementerian koperasi! Hibah stimulus modal bergulir cair penuh ke rekening tanpa kewajiban mencicil.',
    confiscatesLandDeed: false,
    cashChange: 18_000_000,
    stressChange: -15,
    icon: '🏪'
  },
  {
    id: 'takdir_menang_tender',
    eventType: 'TAKDIR',
    tier: 'SEDANG',
    diceRange: [3, 4],
    diceRangeText: 'Dadu 3 - 4 (Takdir Sedang)',
    title: 'Menang Tender Pengadaan Dinas Daerah (LPSE)',
    headline: 'SPK PENUNJUKAN RESMI DITANDATANGANI!',
    categoryBadge: 'PROYEK PEMERINTAH',
    description: 'Berkas kualifikasi lolos lelang pengadaan konsumsi dinas dan seragam dinas se-kabupaten. Margin keuntungan bersih langsung ditransfer ke kas Anda!',
    confiscatesLandDeed: false,
    cashChange: 15_000_000,
    stressChange: -10,
    politicalChange: 12,
    icon: '📊'
  },
  {
    id: 'takdir_pemekaran_dob',
    eventType: 'TAKDIR',
    tier: 'SEDANG',
    diceRange: [3, 4],
    diceRangeText: 'Dadu 3 - 4 (Takdir Sedang)',
    title: 'Pemekaran Daerah Otonom Baru (DOB)',
    headline: 'WILAYAH DIMEKARKAN JADI KOTA OTONOM!',
    categoryBadge: 'OTONOMI DAERAH',
    description: 'UU pembentukan Daerah Otonom Baru disahkan! Harga tanah meroket dan pemerintah pusat menyalurkan dana alokasi khusus (DAK) langsung.',
    confiscatesLandDeed: false,
    cashChange: 16_000_000,
    stressChange: -12,
    politicalChange: 18,
    icon: '🏛️'
  },

  // --- TIER RINGAN (Dadu 5 & 6) ---
  {
    id: 'takdir_undian_bank',
    eventType: 'TAKDIR',
    tier: 'RINGAN',
    diceRange: [5, 6],
    diceRangeText: 'Dadu 5 - 6 (Takdir Ringan)',
    title: 'Menang Undian Tabungan Bank Pembangunan Daerah',
    headline: 'SELAMAT! NOMOR REKENING TEMBUS UNDIAN!',
    categoryBadge: 'HADIAH TABUNGAN',
    description: 'Saat cek mutasi di ATM, saldo Anda bertambah berkat program undian kesetiaan nasabah bank daerah. Uang kaget halal untuk belanja santai.',
    confiscatesLandDeed: false,
    cashChange: 5_000_000,
    stressChange: -10,
    icon: '🏦'
  },
  {
    id: 'takdir_pemutihan_pajak',
    eventType: 'TAKDIR',
    tier: 'RINGAN',
    diceRange: [5, 6],
    diceRangeText: 'Dadu 5 - 6 (Takdir Ringan)',
    title: 'Program Pemutihan Denda Pajak & Retribusi',
    headline: 'GRATIS DENDA & DISKON POKOK PAJAK DAERAH!',
    categoryBadge: 'INSENTIF FISKAL',
    description: 'Gubernur mengesahkan program pemutihan denda pajak kendaraan dan PBB. Anda menghemat pengeluaran rutin dan mendapatkan cashback kas.',
    confiscatesLandDeed: false,
    cashChange: 4_000_000,
    stressChange: -5,
    icon: '🏷️'
  },
  {
    id: 'takdir_voucher_sembako',
    eventType: 'TAKDIR',
    tier: 'RINGAN',
    diceRange: [5, 6],
    diceRangeText: 'Dadu 5 - 6 (Takdir Ringan)',
    title: 'Kupon Pasar Murah & Subsidi Sembako Premium',
    headline: 'BELANJA BULANAN GRATIS & DISUBSIDI!',
    categoryBadge: 'SUBSIDI DAERAH',
    description: 'Mendapat tiket VIP operasi pasar murah pemda. Belanja minyak goreng, beras premium, dan telur diborong dengan subsidi penuh.',
    confiscatesLandDeed: false,
    cashChange: 3_000_000,
    stressChange: -5,
    icon: '🛍️'
  }
];

import { BoardTile } from '../types/game';

export const PERIMETER_TILES: BoardTile[] = [
  // Tile 0: Bottom-Left (START)
  {
    id: 0,
    name: 'START / GAJIAN UMR NASIONAL',
    shortName: 'Gajian UMR',
    zone: 'START',
    actionType: 'START_SALARY',
    island: 'SPECIAL',
    islandName: 'Nasional',
    description: 'Tanggal 25 telah tiba! Terima gaji bulanan UMR sebesar Rp 45.000.000 (disesuaikan inflasi) dan pulihkan stres -10%.',
    subtext: '+Rp 45 Jt'
  },

  // Tile 1: PULAU JAWA - DKI JAKARTA
  {
    id: 1,
    name: 'Surat Tanah DKI Jakarta (Monas & SCBD)',
    shortName: 'DKI Jakarta',
    zone: 'PULAU_JAWA',
    actionType: 'PROPERTY',
    island: 'JAWA',
    islandName: 'Pulau Jawa',
    cityName: 'DKI Jakarta',
    certificateTitle: 'Surat Tanah SHM DKI Jakarta',
    price: 120_000_000,
    rent: 27_000_000,
    upgradeCost: 60_000_000,
    description: 'Ibu kota bisnis Indonesia. Gedung pencakar langit SCBD, deretan mobil mewah, dan kafe artisan. Pusat putaran uang terbesar nasional.',
    subtext: 'Beli Rp 120 Jt'
  },

  // Tile 2: PULAU JAWA - SURABAYA
  {
    id: 2,
    name: 'Surat Tanah Kota Surabaya (Tunjungan & Rungkut)',
    shortName: 'Surabaya',
    zone: 'PULAU_JAWA',
    actionType: 'PROPERTY',
    island: 'JAWA',
    islandName: 'Pulau Jawa',
    cityName: 'Surabaya',
    certificateTitle: 'Surat Tanah SHM Kota Surabaya',
    price: 95_000_000,
    rent: 21_000_000,
    upgradeCost: 48_000_000,
    description: 'Kota Pahlawan sentra industri maritim dan pusat niaga Jawa Timur. Jalur distribusi logistik tersibuk kedua di Indonesia.',
    subtext: 'Beli Rp 95 Jt'
  },

  // Tile 3: PULAU JAWA - BANDUNG
  {
    id: 3,
    name: 'Surat Tanah Kota Bandung (Dago & Gedung Sate)',
    shortName: 'Bandung',
    zone: 'PULAU_JAWA',
    actionType: 'PROPERTY',
    island: 'JAWA',
    islandName: 'Pulau Jawa',
    cityName: 'Bandung',
    certificateTitle: 'Surat Tanah SHM Kota Bandung',
    price: 80_000_000,
    rent: 18_000_000,
    upgradeCost: 40_000_000,
    description: 'Kota Kembang sentra ekonomi kreatif, pariwisata kuliner, dan perguruan tinggi bergengsi. Selalu macet diserbu wisatawan saat akhir pekan.',
    subtext: 'Beli Rp 80 Jt'
  },

  // Tile 4: EVENT MUSIBAH #1 (Rampasan Negara & PSN)
  {
    id: 4,
    name: 'HAL TAK TERDUGA: MUSIBAH & RAMPASAN NEGARA #1',
    shortName: 'Musibah PSN',
    zone: 'EVENT_MUSIBAH',
    actionType: 'EVENT_MUSIBAH',
    island: 'SPECIAL',
    islandName: 'Bencana & Sita Negara',
    description: 'Musibah tak terduga! Lempar dadu nasibmu: Dadu 1-2 Musibah Berat (Sita Lahan PSN), Dadu 3-4 Musibah Sedang, Dadu 5-6 Musibah Ringan!',
    subtext: 'Kocok Dadu Musibah!'
  },

  // Tile 5: PULAU JAWA - SEMARANG
  {
    id: 5,
    name: 'Surat Tanah Kota Semarang (Simpang Lima)',
    shortName: 'Semarang',
    zone: 'PULAU_JAWA',
    actionType: 'PROPERTY',
    island: 'JAWA',
    islandName: 'Pulau Jawa',
    cityName: 'Semarang',
    certificateTitle: 'Surat Tanah SHM Kota Semarang',
    price: 70_000_000,
    rent: 15_000_000,
    upgradeCost: 35_000_000,
    description: 'Pusat pemerintahan Jawa Tengah di Simpang Lima. Sentra niaga pelabuhan Tanjung Emas serta industri makanan dan jamu tradisional legendaris.',
    subtext: 'Beli Rp 70 Jt'
  },

  // Tile 6: PULAU SUMATRA - MEDAN
  {
    id: 6,
    name: 'Surat Tanah Kota Medan (Kesawan & Merdeka)',
    shortName: 'Medan',
    zone: 'PULAU_SUMATRA',
    actionType: 'PROPERTY',
    island: 'SUMATRA',
    islandName: 'Pulau Sumatra',
    cityName: 'Medan',
    certificateTitle: 'Surat Tanah SHM Kota Medan',
    price: 78_000_000,
    rent: 17_000_000,
    upgradeCost: 38_000_000,
    description: 'Metropolis terbesar Pulau Sumatra. Sentra bisnis komoditas sawit, kuliner legendaris 24 jam, dan gerbang perdagangan Selat Malaka.',
    subtext: 'Beli Rp 78 Jt'
  },

  // Tile 7: KANTOR PERTANAHAN BPN & BIROKRASI
  {
    id: 7,
    name: 'KANTOR PERTANAHAN BPN & BIROKRASI',
    shortName: 'Kantor ATR/BPN',
    zone: 'SPECIAL_CORNER',
    actionType: 'BIROKRASI_CHECK',
    island: 'SPECIAL',
    islandName: 'Layanan Negara',
    description: 'Pengurusan sertifikat tanah tersendat karena berkas tertumpuk. Uji kesabaran warga menghadapi birokrasi calo dan loket antrean panjang.',
    subtext: 'Birokrasi Pertanahan'
  },

  // Tile 8: PULAU SUMATRA - PALEMBANG
  {
    id: 8,
    name: 'Surat Tanah Kota Palembang (Jembatan Ampera)',
    shortName: 'Palembang',
    zone: 'PULAU_SUMATRA',
    actionType: 'PROPERTY',
    island: 'SUMATRA',
    islandName: 'Pulau Sumatra',
    cityName: 'Palembang',
    certificateTitle: 'Surat Tanah SHM Kota Palembang',
    price: 65_000_000,
    rent: 14_000_000,
    upgradeCost: 32_000_000,
    description: 'Bumi Sriwijaya di tepian Sungai Musi nan megah. Kaya hasil tambang batubara, industri pupuk, serta lalu lintas LRT modern.',
    subtext: 'Beli Rp 65 Jt'
  },

  // Tile 9: PULAU SUMATRA - PADANG
  {
    id: 9,
    name: 'Surat Tanah Kota Padang (Ranah Minang & Teluk Bayur)',
    shortName: 'Padang',
    zone: 'PULAU_SUMATRA',
    actionType: 'PROPERTY',
    island: 'SUMATRA',
    islandName: 'Pulau Sumatra',
    cityName: 'Padang',
    certificateTitle: 'Surat Tanah SHM Kota Padang',
    price: 55_000_000,
    rent: 12_000_000,
    upgradeCost: 28_000_000,
    description: 'Pusat budaya Minangkabau di pesisir barat Sumatra. Sentra ekspor semen Teluk Bayur dan tradisi saudagar perantau yang ulet.',
    subtext: 'Beli Rp 55 Jt'
  },

  // Tile 10: EVENT TAKDIR #1 (Ganti Untung Tol & Kejutan Nasib)
  {
    id: 10,
    name: 'HAL TAK TERDUGA: EVENT TAKDIR & GANTI UNTUNG #1',
    shortName: 'Takdir Rezeki',
    zone: 'EVENT_TAKDIR',
    actionType: 'EVENT_TAKDIR',
    island: 'SPECIAL',
    islandName: 'Nasib & Hoki',
    description: 'Takdir kejutan tak terduga! Lempar dadu nasibmu: Dadu 1-2 Takdir Istimewa (Ganti Untung PSN/Warisan Sultan), Dadu 3-4 Modal UMKM, Dadu 5-6 Hoki Undian!',
    subtext: 'Kocok Dadu Takdir!'
  },

  // Tile 11: PULAU SUMATRA - BATAM
  {
    id: 11,
    name: 'Surat Tanah Kota Batam (Kawasan Perdagangan Bebas FTZ)',
    shortName: 'Batam (FTZ)',
    zone: 'PULAU_SUMATRA',
    actionType: 'PROPERTY',
    island: 'SUMATRA',
    islandName: 'Pulau Sumatra',
    cityName: 'Batam',
    certificateTitle: 'Surat Tanah SHM Kota Batam',
    price: 85_000_000,
    rent: 19_000_000,
    upgradeCost: 42_000_000,
    description: 'Kawasan perdagangan bebas dan pelabuhan internasional persis di seberang Singapura. Pusat manufaktur elektronik dan galangan kapal megah.',
    subtext: 'Beli Rp 85 Jt'
  },

  // Tile 12: PULAU KALIMANTAN - BALIKPAPAN
  {
    id: 12,
    name: 'Surat Tanah Kota Balikpapan (Kilang Minyak Semayang)',
    shortName: 'Balikpapan',
    zone: 'PULAU_KALIMANTAN',
    actionType: 'PROPERTY',
    island: 'KALIMANTAN',
    islandName: 'Pulau Kalimantan',
    cityName: 'Balikpapan',
    certificateTitle: 'Surat Tanah SHM Kota Balikpapan',
    price: 90_000_000,
    rent: 20_000_000,
    upgradeCost: 45_000_000,
    description: 'Kota Minyak modern dengan tata kota terbersih di Indonesia. Gerbang logistik utama penunjang pembangunan megaproyek IKN.',
    subtext: 'Beli Rp 90 Jt'
  },

  // Tile 13: PULAU KALIMANTAN - PONTIANAK
  {
    id: 13,
    name: 'Surat Tanah Kota Pontianak (Tugu Khatulistiwa & Kapuas)',
    shortName: 'Pontianak',
    zone: 'PULAU_KALIMANTAN',
    actionType: 'PROPERTY',
    island: 'KALIMANTAN',
    islandName: 'Pulau Kalimantan',
    cityName: 'Pontianak',
    certificateTitle: 'Surat Tanah SHM Kota Pontianak',
    price: 60_000_000,
    rent: 13_000_000,
    upgradeCost: 30_000_000,
    description: 'Kota persis di garis Khatulistiwa bumi di tepian Sungai Kapuas terpanjang di Indonesia. Pusat ekspor bauksit dan perkebunan karet.',
    subtext: 'Beli Rp 60 Jt'
  },

  // Tile 14: LAPAS SUKAMISKIN (SEL VIP MEWAH)
  {
    id: 14,
    name: 'LAPAS SUKAMISKIN (SEL MEWAH VIP)',
    shortName: 'Lapas Sukamiskin',
    zone: 'SPECIAL_CORNER',
    actionType: 'PRISON_SUKAMISKIN',
    island: 'SPECIAL',
    islandName: 'Penjara VIP',
    description: 'Fasilitas tahanan VIP koruptor lengkap dengan AC, dispenser, kasur ortopedi, dan izin pelesiran berobat ke luar lapas.',
    subtext: 'Sel Tahanan'
  },

  // Tile 15: PULAU KALIMANTAN - IKN NUSANTARA
  {
    id: 15,
    name: 'Surat Tanah IKN Nusantara (KIPP & Istana Garuda)',
    shortName: 'IKN Nusantara',
    zone: 'PULAU_KALIMANTAN',
    actionType: 'PROPERTY',
    island: 'KALIMANTAN',
    islandName: 'Pulau Kalimantan',
    cityName: 'IKN Nusantara',
    certificateTitle: 'Surat Tanah SHM IKN Nusantara',
    price: 150_000_000,
    rent: 36_000_000,
    upgradeCost: 75_000_000,
    description: 'Ibu Kota Nusantara! Kawasan Inti Pusat Pemerintahan megah dengan Istana Garuda. Lahan investasi bernilai triliunan rupiah dengan sewa tertinggi.',
    subtext: 'Beli Rp 150 Jt'
  },

  // Tile 16: PULAU KALIMANTAN - BANJARMASIN
  {
    id: 16,
    name: 'Surat Tanah Kota Banjarmasin (Pasar Terapung)',
    shortName: 'Banjarmasin',
    zone: 'PULAU_KALIMANTAN',
    actionType: 'PROPERTY',
    island: 'KALIMANTAN',
    islandName: 'Pulau Kalimantan',
    cityName: 'Banjarmasin',
    certificateTitle: 'Surat Tanah SHM Kota Banjarmasin',
    price: 65_000_000,
    rent: 14_000_000,
    upgradeCost: 32_000_000,
    description: 'Kota Seribu Sungai pusat perdagangan intan Martapura, batubara, dan pasar terapung tradisional di atas perahu jukung.',
    subtext: 'Beli Rp 65 Jt'
  },

  // Tile 17: PULAU SULAWESI - MAKASSAR
  {
    id: 17,
    name: 'Surat Tanah Kota Makassar (Pantai Losari & Pelabuhan)',
    shortName: 'Makassar',
    zone: 'PULAU_SULAWESI',
    actionType: 'PROPERTY',
    island: 'SULAWESI',
    islandName: 'Pulau Sulawesi',
    cityName: 'Makassar',
    certificateTitle: 'Surat Tanah SHM Kota Makassar',
    price: 82_000_000,
    rent: 18_000_000,
    upgradeCost: 41_000_000,
    description: 'Pintu gerbang utama Indonesia Timur. Pusat perdagangan maritim, pelabuhan peti kemas internasional, dan kuliner coto makassar legendaris.',
    subtext: 'Beli Rp 82 Jt'
  },

  // Tile 18: EVENT MUSIBAH #2 (Sita Aset Satgas BLBI & Bencana)
  {
    id: 18,
    name: 'HAL TAK TERDUGA: SITA ASET SATGAS NEGARA #2',
    shortName: 'Sita Satgas',
    zone: 'EVENT_MUSIBAH',
    actionType: 'EVENT_MUSIBAH',
    island: 'SPECIAL',
    islandName: 'Bencana & Sita Negara',
    description: 'Musibah penertiban hukum mendadak! Lempar dadu nasibmu: Dadu 1-2 Sita Satgas Ekstrem, Dadu 3-4 Sengketa Tanah/Banjir, Dadu 5-6 Macet & Denda!',
    subtext: 'Kocok Dadu Musibah!'
  },

  // Tile 19: PULAU SULAWESI - MANADO
  {
    id: 19,
    name: 'Surat Tanah Kota Manado (Bunaken & Boulevard)',
    shortName: 'Manado',
    zone: 'PULAU_SULAWESI',
    actionType: 'PROPERTY',
    island: 'SULAWESI',
    islandName: 'Pulau Sulawesi',
    cityName: 'Manado',
    certificateTitle: 'Surat Tanah SHM Kota Manado',
    price: 68_000_000,
    rent: 15_000_000,
    upgradeCost: 34_000_000,
    description: 'Kota Tinutuan di tepian Laut Sulawesi. Pusat pariwisata bahari kelas dunia Bunaken dan hub ekspor perikanan tuna segar ke Jepang.',
    subtext: 'Beli Rp 68 Jt'
  },

  // Tile 20: PULAU SULAWESI - PALU (PORTAL JALUR TIKUS ORDAL)
  {
    id: 20,
    name: 'Surat Tanah Kota Palu & Portal Jalur Ordal',
    shortName: 'Palu (Ordal)',
    zone: 'PULAU_SULAWESI',
    actionType: 'PROPERTY',
    island: 'SULAWESI',
    islandName: 'Pulau Sulawesi',
    cityName: 'Palu',
    certificateTitle: 'Surat Tanah SHM Kota Palu',
    price: 58_000_000,
    rent: 12_500_000,
    upgradeCost: 29_000_000,
    description: 'Pusat niaga Teluk Palu. Menyimpan pintu masuk rahasia menuju Rute Korupsi & Proyek Siluman Ordal bagi yang berani mengambil risiko OTT KPK!',
    subtext: 'Beli Rp 58 Jt (Ada Portal)'
  },

  // Tile 21: GEDUNG DPR RI SENAYAN
  {
    id: 21,
    name: 'GEDUNG DPR RI SENAYAN',
    shortName: 'DPR Senayan',
    zone: 'SPECIAL_CORNER',
    actionType: 'PARLIAMENT_SENAYAN',
    island: 'SPECIAL',
    islandName: 'Kekuasaan Politik',
    description: 'Pusat kekuasaan politik nasional! Pemain dengan Pengaruh Politik dapat melobi atau mengesahkan UU strategis yang menguntungkan diri sendiri.',
    subtext: 'Lobi & RUU'
  },

  // Tile 22: PULAU SULAWESI - KENDARI
  {
    id: 22,
    name: 'Surat Tanah Kota Kendari (Kawasan Smelter Nikel)',
    shortName: 'Kendari (Nikel)',
    zone: 'PULAU_SULAWESI',
    actionType: 'PROPERTY',
    island: 'SULAWESI',
    islandName: 'Pulau Sulawesi',
    cityName: 'Kendari',
    certificateTitle: 'Surat Tanah SHM Kota Kendari',
    price: 72_000_000,
    rent: 16_000_000,
    upgradeCost: 36_000_000,
    description: 'Pusat hilirisasi nikel terbesar di Sulawesi Tenggara untuk rantai pasok baterai kendaraan listrik global. Investasi modal asing melimpah.',
    subtext: 'Beli Rp 72 Jt'
  },

  // Tile 23: PULAU PAPUA - JAYAPURA
  {
    id: 23,
    name: 'Surat Tanah Kota Jayapura (Jembatan Youtefa)',
    shortName: 'Jayapura',
    zone: 'PULAU_PAPUA',
    actionType: 'PROPERTY',
    island: 'PAPUA',
    islandName: 'Pulau Papua',
    cityName: 'Jayapura',
    certificateTitle: 'Surat Tanah SHM Kota Jayapura',
    price: 75_000_000,
    rent: 16_500_000,
    upgradeCost: 37_000_000,
    description: 'Ibu kota Provinsi Papua dengan ikon megah Jembatan Merah Youtefa. Pusat administrasi dan simpul perdagangan kawasan timur perbatasan Pasifik.',
    subtext: 'Beli Rp 75 Jt'
  },

  // Tile 24: EVENT TAKDIR #2 (Pemekaran DOB & Durian Runtuh)
  {
    id: 24,
    name: 'HAL TAK TERDUGA: EVENT TAKDIR & PEMEKARAN DOB #2',
    shortName: 'Takdir Sultan',
    zone: 'EVENT_TAKDIR',
    actionType: 'EVENT_TAKDIR',
    island: 'SPECIAL',
    islandName: 'Nasib & Hoki',
    description: 'Kejutan takdir tak terduga! Lempar dadu nasibmu: Dadu 1-2 Warisan Sultan/Ganti Untung, Dadu 3-4 Pemekaran Daerah/Tender, Dadu 5-6 Hoki Diskon Pajak!',
    subtext: 'Kocok Dadu Takdir!'
  },

  // Tile 25: PULAU PAPUA - SORONG
  {
    id: 25,
    name: 'Surat Tanah Kota Sorong (Pintu Gerbang Raja Ampat)',
    shortName: 'Sorong',
    zone: 'PULAU_PAPUA',
    actionType: 'PROPERTY',
    island: 'PAPUA',
    islandName: 'Pulau Papua',
    cityName: 'Sorong',
    certificateTitle: 'Surat Tanah SHM Kota Sorong',
    price: 80_000_000,
    rent: 17_500_000,
    upgradeCost: 40_000_000,
    description: 'Kota Minyak di Papua Barat Daya, pintu gerbang destinasi wisata terumbu karang terbaik dunia Raja Ampat serta pelabuhan kontainer modern.',
    subtext: 'Beli Rp 80 Jt'
  },

  // Tile 26: PULAU PAPUA - TIMIKA
  {
    id: 26,
    name: 'Surat Tanah Kota Timika (Tambang Grasberg & Emas)',
    shortName: 'Timika (Tambang)',
    zone: 'PULAU_PAPUA',
    actionType: 'PROPERTY',
    island: 'PAPUA',
    islandName: 'Pulau Papua',
    cityName: 'Timika',
    certificateTitle: 'Surat Tanah SHM Kota Timika',
    price: 115_000_000,
    rent: 26_000_000,
    upgradeCost: 58_000_000,
    description: 'Kawasan tambang emas dan tembaga Grasberg raksasa. Perputaran uang beromzet triliunan rupiah dengan pendapatan daerah luar biasa tinggi.',
    subtext: 'Beli Rp 115 Jt'
  },

  // Tile 27: PULAU PAPUA - MERAUKE
  {
    id: 27,
    name: 'Surat Tanah Kota Merauke (Lumbung Food Estate)',
    shortName: 'Merauke',
    zone: 'PULAU_PAPUA',
    actionType: 'PROPERTY',
    island: 'PAPUA',
    islandName: 'Pulau Papua',
    cityName: 'Merauke',
    certificateTitle: 'Surat Tanah SHM Kota Merauke',
    price: 62_000_000,
    rent: 13_500_000,
    upgradeCost: 31_000_000,
    description: 'Ujung paling timur Indonesia di tapal batas Papua Selatan! Kawasan megaproyek Food Estate lumbung pangan padi dan tebu nasional.',
    subtext: 'Beli Rp 62 Jt'
  }
];

// Special Corruption Route Shortcut Tiles (Internal Board Path)
export const CORRUPTION_ROUTE_TILES: BoardTile[] = [
  {
    id: 100,
    name: 'Proyek Pengadaan Fiktif APBD',
    shortName: 'Pengadaan Fiktif',
    zone: 'KORUPSI_ROUTE',
    actionType: 'CORRUPTION_PROJECT',
    description: 'Mark-up anggaran server dinas dan lem aibon hingga 400%! Ambil uang tunai Rp 60.000.000, namun radar OTT KPK meningkat drastis!',
    subtext: '+Rp 60 Jt (Risiko KPK +25%)',
    isCorruptionRoute: true
  },
  {
    id: 101,
    name: 'Bagi-Bagi Kuota Impor Beras & Sapi',
    shortName: 'Kuota Impor',
    zone: 'KORUPSI_ROUTE',
    actionType: 'CORRUPTION_PROJECT',
    description: 'Kongkalikong regulasi impor bersama mafia pangan. Dapatkan modal uang Rp 45.000.000 dan +20 Pengaruh Politik!',
    subtext: '+Rp 45 Jt & +20 Politik',
    isCorruptionRoute: true
  },
  {
    id: 102,
    name: 'Pencucian Uang & Properti Mewah Samaran',
    shortName: 'Cuci Uang Mewah',
    zone: 'KORUPSI_ROUTE',
    actionType: 'CORRUPTION_LAUNDER',
    description: 'Cuci uang hasil korupsi dengan membeli aset properti mewah (Penthouse SCBD, Villa Bali, Ruko Samaran) berdiskon pajak 35%-45%, namun memicu lonjakan radar deteksi KPK!',
    subtext: 'Diskon Pajak 40% (Risiko KPK +35%)',
    isCorruptionRoute: true
  },
  {
    id: 103,
    name: 'SIDAK BPK & RADAR OPERASI KPK',
    shortName: 'Sidak KPK / OTT',
    zone: 'KORUPSI_ROUTE',
    actionType: 'CORRUPTION_AUDIT',
    description: 'Auditor BPK dan penyidik KPK melakukan penyadapan telepon! Lempar dadu: Jika angka 1-3 (atau 1-4 bila radar tinggi), TERTANGKAP OTT KPK dan harus memberi uang suap Rp 20 Jt atau dibui!',
    subtext: 'Pertaruhan OTT KPK',
    isCorruptionRoute: true
  }
];

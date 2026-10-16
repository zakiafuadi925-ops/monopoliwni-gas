import { BoardTile } from '../types/game';

export interface LuxuryLaunderProperty {
  id: number;
  tileNumber: number;          // Petak # on the board (0 - 27)
  name: string;
  shortName: string;
  category: 'PENTHOUSE' | 'VILLA' | 'FRONT_BUSINESS';
  location: string;
  cityName: string;
  certificateTitle: string;
  normalPrice: number;
  taxDiscountPercent: number; // e.g., 40%
  launderPrice: number;        // discounted purchase price
  baseRent: number;            // rent generated per visit
  upgradeCost: number;
  kpkRiskIncrease: number;     // extra KPK suspicion percentage
  stressRelief: number;        // stress reduced when dirty cash is secured
  icon: string;
  description: string;
  launderingMethod: string;    // narrative satire for Indonesian context
  taxSavingsText: string;
}

// Luxury properties correspond directly to the most prestigious real tiles on the board (#0 to #28)
export const LUXURY_LAUNDER_PROPERTIES: LuxuryLaunderProperty[] = [
  {
    id: 15,
    tileNumber: 15,
    name: 'Surat Tanah IKN Nusantara (KIPP & Istana Garuda)',
    shortName: 'IKN Nusantara',
    category: 'PENTHOUSE',
    location: 'KIPP Sepaku, Penajam Paser Utara, Kalimantan Timur',
    cityName: 'IKN Nusantara',
    certificateTitle: 'Surat Hak Milik Khusus Otorita IKN',
    normalPrice: 140_000_000,
    taxDiscountPercent: 40,
    launderPrice: 84_000_000,
    baseRent: 32_000_000,
    upgradeCost: 70_000_000,
    kpkRiskIncrease: 35,
    stressRelief: 20,
    icon: '🏛️',
    description: 'Kavling super VIP Kawasan Inti Pusat Pemerintahan (KIPP) tepat di depan Istana Garuda. Aset pelarian modal teratas para elite politik Konoha.',
    launderingMethod: 'Memakai nama nominee PT cangkang properti khusus IKN tanpa lapor LHKPN.',
    taxSavingsText: 'Hemat Pajak Rp 56.000.000 (Diskon 40%)'
  },
  {
    id: 1,
    tileNumber: 1,
    name: 'Surat Tanah DKI Jakarta (Monas & Penthouse SCBD)',
    shortName: 'DKI Jakarta (SCBD)',
    category: 'PENTHOUSE',
    location: 'Kawasan Finansial SCBD & Monas, Jakarta Selatan',
    cityName: 'DKI Jakarta',
    certificateTitle: 'Surat Tanah SHM DKI Jakarta',
    normalPrice: 120_000_000,
    taxDiscountPercent: 40,
    launderPrice: 72_000_000,
    baseRent: 27_000_000,
    upgradeCost: 60_000_000,
    kpkRiskIncrease: 30,
    stressRelief: 15,
    icon: '🏙️',
    description: 'Unit penthouse privat di segitiga emas SCBD Sudirman dengan elevator privat dan pemandangan bundaran Senayan. Surga aset para konglomerat.',
    launderingMethod: 'Injeksi kas haram proyek fiktif lewat yayasan nir-pajak offshore tanpa audit.',
    taxSavingsText: 'Hemat Pajak Rp 48.000.000 (Diskon 40%)'
  },
  {
    id: 26,
    tileNumber: 26,
    name: 'Surat Tanah Kota Timika (Tambang Grasberg & Emas)',
    shortName: 'Timika (Tambang)',
    category: 'FRONT_BUSINESS',
    location: 'Kawasan Konsesi Tambang Grasberg, Mimika, Papua Tengah',
    cityName: 'Timika',
    certificateTitle: 'Surat Tanah SHM Kota Timika',
    normalPrice: 115_000_000,
    taxDiscountPercent: 40,
    launderPrice: 69_000_000,
    baseRent: 26_000_000,
    upgradeCost: 58_000_000,
    kpkRiskIncrease: 30,
    stressRelief: 15,
    icon: '⛏️',
    description: 'Kavling konsesi mineral emas & tembaga raksasa beromzet triliunan rupiah. Cash flow dividen sangat besar untuk mencuci dana proyek siluman.',
    launderingMethod: 'Manipulasi saham nominee lokal dan faktur fiktif vendor logistik alat berat tambang.',
    taxSavingsText: 'Hemat Pajak Rp 46.000.000 (Diskon 40%)'
  },
  {
    id: 2,
    tileNumber: 2,
    name: 'Surat Tanah Kota Surabaya (Tunjungan & Ruko Rungkut)',
    shortName: 'Surabaya (Rungkut)',
    category: 'FRONT_BUSINESS',
    location: 'Sentra Bisnis Tunjungan & Kawasan Industri Rungkut, Surabaya',
    cityName: 'Surabaya',
    certificateTitle: 'Surat Tanah SHM Kota Surabaya',
    normalPrice: 95_000_000,
    taxDiscountPercent: 40,
    launderPrice: 57_000_000,
    baseRent: 21_000_000,
    upgradeCost: 48_000_000,
    kpkRiskIncrease: 25,
    stressRelief: 10,
    icon: '🏪',
    description: 'Deretan ruko komersial dan kompleks pergudangan logistik Jawa Timur. Pusat perputaran kas harian paling likuid di luar ibu kota.',
    launderingMethod: 'Pemutaran uang kas harian di rantai minimarket grosir samaran tanpa faktur resmi.',
    taxSavingsText: 'Hemat Pajak Rp 38.000.000 (Diskon 40%)'
  },
  {
    id: 11,
    tileNumber: 11,
    name: 'Surat Tanah Kota Batam (Kawasan Perdagangan Bebas FTZ)',
    shortName: 'Batam (FTZ)',
    category: 'FRONT_BUSINESS',
    location: 'Kawasan Free Trade Zone (FTZ) Selat Malaka, Batam',
    cityName: 'Batam',
    certificateTitle: 'Surat Tanah SHM Kawasan FTZ Batam',
    normalPrice: 90_000_000,
    taxDiscountPercent: 40,
    launderPrice: 54_000_000,
    baseRent: 20_000_000,
    upgradeCost: 45_000_000,
    kpkRiskIncrease: 25,
    stressRelief: 10,
    icon: '🚢',
    description: 'Zona pelabuhan bebas bea masuk dan bebas PPN. Surga transfer devisa ke luar negeri tanpa pantauan ketat OJK.',
    launderingMethod: 'Rekayasa dokumen impor komoditas fiktif dan transfer pricing antar-perusahaan cangkang.',
    taxSavingsText: 'Hemat Pajak Rp 36.000.000 (Diskon 40%)'
  },
  {
    id: 25,
    tileNumber: 25,
    name: 'Surat Tanah Kota Sorong (Pintu Gerbang Raja Ampat)',
    shortName: 'Sorong Raja Ampat',
    category: 'VILLA',
    location: 'Tebing Karang Bahari Kepulauan Raja Ampat, Sorong',
    cityName: 'Sorong',
    certificateTitle: 'Surat Tanah SHM Kota Sorong',
    normalPrice: 80_000_000,
    taxDiscountPercent: 40,
    launderPrice: 48_000_000,
    baseRent: 17_500_000,
    upgradeCost: 40_000_000,
    kpkRiskIncrease: 25,
    stressRelief: 15,
    icon: '🏖️',
    description: 'Resor privat tepi karang laut eksotis dengan helipad pribadi dan dermaga yacht. Menghasilkan sewa dolar tinggi dari turis jetset mancanegara.',
    launderingMethod: 'Meminjam KTP nominee warga lokal dan menyamarkan transaksi lewat yayasan ekowisata.',
    taxSavingsText: 'Hemat Pajak Rp 32.000.000 (Diskon 40%)'
  }
];

export const LUXURY_BOARD_TILES: BoardTile[] = LUXURY_LAUNDER_PROPERTIES.map(p => ({
  id: p.id,
  name: p.name,
  shortName: p.shortName,
  zone: 'PULAU_JAWA',
  actionType: 'PROPERTY',
  island: 'SPECIAL',
  islandName: p.location,
  cityName: p.cityName,
  certificateTitle: p.certificateTitle,
  price: p.normalPrice,
  rent: p.baseRent,
  upgradeCost: p.upgradeCost,
  level: 1,
  ownerId: null,
  description: p.description,
  subtext: `Aset Cuci Uang Mewah (${p.taxDiscountPercent}% Diskon)`,
  isCorruptionRoute: true
}));

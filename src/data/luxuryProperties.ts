import { BoardTile } from '../types/game';

export interface LuxuryLaunderProperty {
  id: number;
  name: string;
  shortName: string;
  category: 'PENTHOUSE' | 'VILLA' | 'FRONT_BUSINESS';
  location: string;
  cityName: string;
  certificateTitle: string;
  normalPrice: number;
  taxDiscountPercent: number; // e.g., 40%
  launderPrice: number;        // discounted purchase price
  baseRent: number;            // rent generated per round / visit
  upgradeCost: number;
  kpkRiskIncrease: number;     // extra KPK suspicion percentage
  stressRelief: number;        // stress reduced when dirty cash is secured
  icon: string;
  description: string;
  launderingMethod: string;    // narrative fluff for Indonesian context
  taxSavingsText: string;
}

export const LUXURY_LAUNDER_PROPERTIES: LuxuryLaunderProperty[] = [
  {
    id: 201,
    name: 'Penthouse Mewah SCBD Sudirman (Golden Triangle)',
    shortName: 'Penthouse SCBD',
    category: 'PENTHOUSE',
    location: 'Kawasan Finansial SCBD, Jakarta Selatan',
    cityName: 'SCBD Sudirman',
    certificateTitle: 'Surat Strata Title Penthouse SCBD Tower',
    normalPrice: 120_000_000,
    taxDiscountPercent: 40,
    launderPrice: 72_000_000,
    baseRent: 24_000_000,
    upgradeCost: 45_000_000,
    kpkRiskIncrease: 35,
    stressRelief: 15,
    icon: '🏙️',
    description: 'Unit penthouse privat lantai 52 dengan elevator rahasia, sky pool, dan pemandangan bundaran Senayan. Aset pelarian modal terfavorit para oligarki Konoha.',
    launderingMethod: 'Dibeli atas nama PT Cangkang (Shell Company) offshore di Virgin Islands tanpa pelaporan SPT tahunan.',
    taxSavingsText: 'Hemat Pajak Rp 48.000.000 (Diskon 40%)'
  },
  {
    id: 202,
    name: 'Villa Tebing Privat Samudra Uluwatu (Offshore Nominee)',
    shortName: 'Villa Uluwatu',
    category: 'VILLA',
    location: 'Tebing Karang Uluwatu, Bali',
    cityName: 'Uluwatu Bali',
    certificateTitle: 'Sertifikat Hak Milik Villa Mewah Uluwatu',
    normalPrice: 155_000_000,
    taxDiscountPercent: 45,
    launderPrice: 85_250_000,
    baseRent: 32_000_000,
    upgradeCost: 55_000_000,
    kpkRiskIncrease: 45,
    stressRelief: 20,
    icon: '🏖️',
    description: 'Resor tepi tebing Samudra Hindia dengan helipad pribadi dan dermaga kapal pesiar. Menghasilkan sewa dolar tinggi dari wisatawan jetset mancanegara.',
    launderingMethod: 'Meminjam KTP nominee warga lokal dan yayasan nir-pajak untuk menghindari pemantauan transaksi mencurigakan PPATK.',
    taxSavingsText: 'Hemat Pajak Rp 69.750.000 (Diskon 45%)'
  },
  {
    id: 203,
    name: 'Kompleks Ruko Mewah Menteng & SPBU Samaran (Front Business)',
    shortName: 'Ruko Menteng',
    category: 'FRONT_BUSINESS',
    location: 'Kawasan Komersial Menteng, Jakarta Pusat',
    cityName: 'Menteng',
    certificateTitle: 'Sertifikat HGB Kompleks Ruko Komersial Menteng',
    normalPrice: 90_000_000,
    taxDiscountPercent: 35,
    launderPrice: 58_500_000,
    baseRent: 18_000_000,
    upgradeCost: 35_000_000,
    kpkRiskIncrease: 25,
    stressRelief: 10,
    icon: '🏪',
    description: 'Deretan ruko tiga lantai dan outlet franchise SPBU premium yang digunakan sebagai bisnis penyamar untuk memutar uang kas proyek fiktif setiap hari.',
    launderingMethod: 'Injeksi modal tunai harian bertahap melalui manipulasi faktur penjualan fiktif dan pembukuan ganda.',
    taxSavingsText: 'Hemat Pajak Rp 31.500.000 (Diskon 35%)'
  }
];

export const LUXURY_BOARD_TILES: BoardTile[] = LUXURY_LAUNDER_PROPERTIES.map(p => ({
  id: p.id,
  name: p.name,
  shortName: p.shortName,
  zone: 'SPECIAL_CORNER',
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

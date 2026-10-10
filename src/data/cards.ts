import { DilemmaCard, Player, GameContext } from '../types/game';

export const DILEMMA_CARDS: DilemmaCard[] = [
  {
    id: 'pinjol_ilegal',
    title: 'Tawaran Pinjol Ilegal Dana Kilat',
    category: 'MUSIBAH',
    description: 'Saldo rekening kritis menjelang akhir bulan. Tiba-tiba masuk pesan SMS: "Selamat! Limit pinjaman Rp 80.000.000 disetujui tanpa jaminan, cair 5 menit!"',
    optionA: {
      text: 'Cairkan Pinjaman Sekarang',
      description: 'Dapatkan uang tunai instan untuk napas keuangan, tapi stres melonjak dan risiko teror debt collector menanti.',
      effectText: '+Rp 50.000.000 Tunai · +30% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash += 50_000_000;
        player.stress = Math.min(100, player.stress + Math.round(30 * (player.archetypeId === 'bambang_umr' ? 0.75 : 1)));
        state.addLog(`${player.name} tergiur mencairkan Pinjol ilegal! Dapat Rp 50 Jt tapi stres melonjak ke ${player.stress}%!`, 'DANGER', player.id);
        return { summary: 'Menerima dana pinjol Rp 50 Jt, stres bertambah 30%!' };
      }
    },
    optionB: {
      text: 'Tolak & Bertahan Makan Mie Instan',
      description: 'Pertahankan nama baik SLIK OJK dan ketenangan batin, meski harus ikat pinggang.',
      effectText: '-Rp 2.000.000 (Beli Mie Sedap 10 Dus) · -10% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash = Math.max(0, player.cash - 2_000_000);
        player.stress = Math.max(0, player.stress - 10);
        state.addLog(`${player.name} menolak pinjol dan memilih stok mi instan. Batin tenang, stres turun.`, 'INFO', player.id);
        return { summary: 'Menolak pinjol, membeli kardus mi instan Rp 2 Jt. Stres turun 10%!' };
      }
    }
  },
  {
    id: 'endorse_judol',
    title: 'Tawaran Endorse Promosi Game "Gacor"',
    category: 'VIRAL',
    description: 'Manajemen selebgram menerima tawaran promosi berkedok game petualangan spin online berhadiah kakek zeus dari agen luar negeri.',
    optionA: {
      text: 'Terima Endorse (Tutup Mata)',
      description: 'Honor fantastis masuk rekening pribadi, tetapi radar pengawasan Bareskrim dan KPK meningkat.',
      effectText: '+Rp 65.000.000 Tunai · +20% Radar KPK · +15% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash += 65_000_000;
        player.kpkSuspicionLevel = Math.min(100, player.kpkSuspicionLevel + 20);
        player.stress = Math.min(100, player.stress + 15);
        state.addLog(`${player.name} menerima endorsement game gacor! Rekening gendut Rp 65 Jt tapi radar hukum mengintai.`, 'DANGER', player.id);
        return { summary: 'Menerima bayaran endorse Rp 65 Jt! Radar pengawasan aparat +20%.' };
      }
    },
    optionB: {
      text: 'Tolak & Buat Konten Edukasi Bahaya Judol',
      description: 'Menjadi teladan warganet! Reputasi sosial dan pengaruh politik meningkat tajam.',
      effectText: '+15 Pengaruh Politik · -15% Stres',
      apply: (player: Player, state: GameContext) => {
        player.politicalInfluence = Math.min(100, player.politicalInfluence + 15);
        player.stress = Math.max(0, player.stress - 15);
        state.addLog(`${player.name} menolak promosi judol dan dipuji warganet! +15 Pengaruh Politik.`, 'POLITIC', player.id);
        return { summary: 'Menolak judol dengan integritas! Mendapat +15 Pengaruh Politik dan stres berkurang.' };
      }
    }
  },
  {
    id: 'bea_cukai_piala',
    title: 'Paket Hibah Ditahan Bea Cukai Bandara',
    category: 'KEBIJAKAN',
    description: 'Anda menerima paket penghargaan medali internasional dan buku hadiah dari luar negeri. Bea Cukai menetapkan denda masuk seharga mobil bekas!',
    optionA: {
      text: 'Bayar Denda Bea Masuk Resmi',
      description: 'Mengalah demi barang segera keluar dari gudang penimbunan pabean.',
      effectText: '-Rp 18.000.000 Tunai · +20% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash = Math.max(0, player.cash - 18_000_000);
        player.stress = Math.min(100, player.stress + 20);
        state.addLog(`${player.name} terpaksa membayar denda Bea Cukai sebesar Rp 18 Jt. Emosi jiwa membuncah.`, 'CASH', player.id);
        return { summary: 'Membayar denda Bea Cukai Rp 18 Jt demi mengambil paket sendiri.' };
      }
    },
    optionB: {
      text: 'Viralkan di Media Sosial X / Twitter',
      description: 'Tulis utas panjang lengkap dengan tag akun kementerian. Lempar koin: 50% netizen membela dan gratis, 50% diserang buzzer!',
      effectText: 'Uji Keberuntungan Netizen (50% Sukses Gratis / 50% Kena Somasi)',
      apply: (player: Player, state: GameContext) => {
        const success = Math.random() > 0.45;
        if (success) {
          player.politicalInfluence = Math.min(100, player.politicalInfluence + 20);
          player.stress = Math.max(0, player.stress - 15);
          state.addLog(`Viral Berhasil! Utas ${player.name} trending #BeaCukaiKocak. Paket dibebaskan bea masuk & raih simpati publik!`, 'POLITIC', player.id);
          return { summary: 'Viral di X berhasil! Paket gratis dan mendapat +20 Pengaruh Politik.' };
        } else {
          player.stress = Math.min(100, player.stress + 35);
          player.cash = Math.max(0, player.cash - 8_000_000);
          state.addLog(`Diserang Buzzer! Utas ${player.name} dituduh provokator oleh akun buzzer. Kena denda biaya perkara Rp 8 Jt.`, 'DANGER', player.id);
          return { summary: 'Gagal viral! Diserang buzzer kementerian, stres +35% dan rugi Rp 8 Jt.' };
        }
      }
    }
  },
  {
    id: 'kebocoran_ktp',
    title: 'Data NIK & KK Bocor di Dark Web',
    category: 'MUSIBAH',
    description: 'Situs lembaga pemerintahan kembali diretas hacker Bjorka-wannabe. Data pribadi Anda dijual di forum hacker seharga ribuan dolar Bitcoin.',
    optionA: {
      text: 'Ganti e-KTP & Lapor Dukcapil',
      description: 'Antre dari jam 5 subuh di kantor kelurahan dan bayar calo administrasi.',
      effectText: '-Rp 5.000.000 (Biaya Pengurusan & Calo) · +15% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash = Math.max(0, player.cash - 5_000_000);
        player.stress = Math.min(100, player.stress + 15);
        state.addLog(`${player.name} seharian mengurus pemulihan NIK di kelurahan. Menguras kantong Rp 5 Jt dan tenaga.`, 'INFO', player.id);
        return { summary: 'Mengurus perbaikan identitas. Biaya operasional Rp 5 Jt, stres +15%.' };
      }
    },
    optionB: {
      text: 'Pasrah: "Data Saya Sudah Jadi Milik Umum"',
      description: 'Tidak melakukan apa-apa karena data seluruh 270 juta rakyat juga sudah bocor.',
      effectText: 'Gratis · Tidak Ada Stres Tambahan',
      apply: (player: Player, state: GameContext) => {
        state.addLog(`${player.name} pasrah filosofis: "toh hacker juga males pakai data orang susah".`, 'INFO', player.id);
        return { summary: 'Pasrah atas kebocoran data. Tidak ada biaya, tetap santai.' };
      }
    }
  },
  {
    id: 'timses_pilkada',
    title: 'Tawaran Jadi Koordinator Timses Paslon',
    category: 'NEPOTISME',
    description: 'Menjelang pilkada serentak, politisi lokal menawarkan posisi koordinator pembagi amplop dan pengerah massa di dapil strategis.',
    optionA: {
      text: 'Terima Proposal Dana Operasional',
      description: 'Dapatkan anggaran tunai serangan fajar dan relasi kekuasaan, namun radar OTT KPK meningkat!',
      effectText: '+Rp 50.000.000 Dana Taktis · +25 Pengaruh Politik · +25% Radar KPK',
      apply: (player: Player, state: GameContext) => {
        player.cash += 50_000_000;
        player.politicalInfluence = Math.min(100, player.politicalInfluence + 25);
        player.kpkSuspicionLevel = Math.min(100, player.kpkSuspicionLevel + 25);
        state.addLog(`${player.name} resmi merapat ke gerbong timses! Dapat modal Rp 50 Jt & +25 Pengaruh Politik.`, 'POLITIC', player.id);
        return { summary: 'Mendapat dana timses Rp 50 Jt, +25 Pengaruh Politik, namun risiko KPK +25%!' };
      }
    },
    optionB: {
      text: 'Tolak: Menjaga Netralitas Rakyat',
      description: 'Tetap independen dan tidak mau terlibat kubu-kubuan politik praktis.',
      effectText: '-15% Stres · Hidup Tenang Tanpa Beban Kubu',
      apply: (player: Player, state: GameContext) => {
        player.stress = Math.max(0, player.stress - 15);
        state.addLog(`${player.name} menolak pinangan politik. Menikmati hidup damai sebagai rakyat biasa.`, 'INFO', player.id);
        return { summary: 'Menolak tawaran politik. Stres berkurang 15%.' };
      }
    }
  },
  {
    id: 'ukt_meroket',
    title: 'Kebijakan Kenaikan UKT Kampus PTN-BH',
    category: 'KEBIJAKAN',
    description: 'Kementerian menderegulasi UKT universitas negeri. Uang kuliah tunggal melompat dari golongan 4 ke golongan 8 setara biaya mobil second!',
    optionA: {
      text: 'Bayar Cicilan Pendidikan Lewat Pinjol Kampus',
      description: 'Membayar cicilan semesteran melalui skema pembiayaan fintech kampus yang berbunga.',
      effectText: '-Rp 25.000.000 Tunai · +20% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash = Math.max(0, player.cash - 25_000_000);
        player.stress = Math.min(100, player.stress + 20);
        state.addLog(`${player.name} membayar tagihan UKT kampus melonjak Rp 25 Jt. Berat di ongkos.`, 'CASH', player.id);
        return { summary: 'Membayar tagihan UKT Rp 25 Jt, stres bertambah 20%.' };
      }
    },
    optionB: {
      text: 'Turun ke Jalan Orasi Demo Rektorat',
      description: 'Bawa megafon, bentangkan spanduk tuntutan pembatalan komersialisasi pendidikan tinggi.',
      effectText: '+15 Pengaruh Politik · Lempar Dadu: Aman atau Kena Gas Air Mata',
      apply: (player: Player, state: GameContext) => {
        player.politicalInfluence = Math.min(100, player.politicalInfluence + 15);
        const tearGas = Math.random() > 0.5;
        if (tearGas) {
          player.stress = Math.min(100, player.stress + 25);
          state.addLog(`${player.name} orasi di depan rektorat! Berhasil raih +15 Pengaruh Politik tapi kena semprot gas air mata.`, 'DANGER', player.id);
          return { summary: 'Demo UKT: Raih +15 Pengaruh Politik, terkena gas air mata (+25% stres).' };
        } else {
          player.stress = Math.max(0, player.stress - 10);
          state.addLog(`${player.name} orasi sukses! Tuntutan didengar dekanat. +15 Pengaruh Politik & lega.`, 'POLITIC', player.id);
          return { summary: 'Demo damai sukses! +15 Pengaruh Politik, stres berkurang.' };
        }
      }
    }
  },
  {
    id: 'bansos_beras_kuning',
    title: 'Bantuan Pangan Beras Berbau & Berkutu',
    category: 'MUSIBAH',
    description: 'Pemberian paket bansos pangan ternyata beras stok lama gudang yang warnanya agak kekuningan dan ada kutu berjoget.',
    optionA: {
      text: 'Cuci Bersih & Campur Daun Pandan',
      description: 'Kreativitas bertahan hidup WNI: jemur beras dan masak dengan bumbu wangi.',
      effectText: '+Rp 8.000.000 Nilai Bahan Makanan · +5% Stres',
      apply: (player: Player, state: GameContext) => {
        player.cash += 8_000_000;
        player.stress = Math.min(100, player.stress + 5);
        state.addLog(`${player.name} menyiasati beras bansos berkutu. Hemat anggaran belanja Rp 8 Jt.`, 'INFO', player.id);
        return { summary: 'Mengolah beras bansos: Hemat Rp 8 Jt uang makan.' };
      }
    },
    optionB: {
      text: 'Bawa Sampel & Adukan ke DPRD',
      description: 'Laporkan mutu bansos buruk ke komisi pengawasan pangan daerah.',
      effectText: '+10 Pengaruh Politik · Lawan Mafia Pangan',
      apply: (player: Player, state: GameContext) => {
        player.politicalInfluence = Math.min(100, player.politicalInfluence + 10);
        state.addLog(`${player.name} membawa sampel beras busuk ke DPRD! Diberitakan media lokal, +10 Pengaruh Politik.`, 'POLITIC', player.id);
        return { summary: 'Mengadukan bansos busuk ke dewan: +10 Pengaruh Politik.' };
      }
    }
  },
  {
    id: 'kue_proyek_siluman',
    title: 'Bocoran Tender Proyek Pengadaan Dinas',
    category: 'NEPOTISME',
    description: 'Teman satu almamater yang kini menjabat eselon II membocorkan dokumen lelang proyek pengadaan laptop dinas. Bisa diselipkan perusahaan keluarga!',
    optionA: {
      text: 'Ambil Jatah Tender (Jalur Ordal)',
      description: 'Dapatkan fee komisi awal Rp 70.000.000, tapi KPK mulai memantau rekening Anda!',
      effectText: '+Rp 70.000.000 Tunai · +30% Radar KPK',
      apply: (player: Player, state: GameContext) => {
        player.cash += 70_000_000;
        player.kpkSuspicionLevel = Math.min(100, player.kpkSuspicionLevel + 30);
        state.addLog(`${player.name} mencaplok proyek siluman dinas! Mengantongi Rp 70 Jt, tapi KPK mengawasi lelang.`, 'DANGER', player.id);
        return { summary: 'Mendapat fee proyek Rp 70 Jt! Radar KPK naik drastis +30%.' };
      }
    },
    optionB: {
      text: 'Tolak & Ikut Tender Prosedural',
      description: 'Menjaga integritas agar tidur malam tetap nyenyak tanpa was-was bunyi bel penyidik jam 4 subuh.',
      effectText: '-15% Stres · Radar KPK Berkurang -15%',
      apply: (player: Player, state: GameContext) => {
        player.stress = Math.max(0, player.stress - 15);
        player.kpkSuspicionLevel = Math.max(0, player.kpkSuspicionLevel - 15);
        state.addLog(`${player.name} menolak gratifikasi tender dinas. Tidur nyenyak, risiko KPK turun.`, 'INFO', player.id);
        return { summary: 'Menolak gratifikasi lelang. Risiko KPK turun -15% dan stres reda.' };
      }
    }
  }
];

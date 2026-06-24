/**
 * RFID Solutions — Cinematic Warehouse Journey
 *
 * Single source of truth for the 6-stage "follow a pallet" experience.
 * A hero pallet travels along WAYPOINTS (one segment per stage) while the
 * camera follows it using each stage's `camOffset`. Pins are anchored to real
 * 3D world coordinates and projected to the screen every frame, so labels
 * stick to features as the camera moves.
 *
 * Content is in Indonesian to match the supply-chain narrative
 * (Gudang Utama -> Distributor).
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface JourneyPin {
  id: string;
  label: string;
  world: Vec3; // 3D anchor, projected to screen each frame
  title: string;
  desc: string;
  imgBg: string;
}

export interface JourneyStage {
  phase: number;
  label: string; // e.g. "STEP 01"
  phaseLabel: string; // nav chip label
  title: string; // detail heading
  text: string; // bottom-right step narration
  camOffset: Vec3; // camera position relative to the followed target
  fogDensity: number;
  pins: JourneyPin[];
}

export const STAGE_COUNT = 6;

/**
 * Hero pallet path. 7 waypoints = 6 segments (one per stage). The pallet's
 * world position at journey progress p in [0,1] is interpolated across these.
 * y changes encode lifting onto a rack / onto the truck bed.
 */
export const WAYPOINTS: Vec3[] = [
  { x: 8, y: 1.6, z: -16 }, // 0  start: inbound truck at dock
  { x: 8, y: 1.6, z: -3 }, // 1  end inbound: inside receiving
  { x: 16, y: 2.4, z: 2 }, // 2  end storage: placed on rack
  { x: 8, y: 1.6, z: -5 }, // 3  end picking: at staging
  { x: 8, y: 2.6, z: -15 }, // 4  end outbound: on truck bed at dock
  { x: 8, y: 2.6, z: -78 }, // 5  end transit: truck at distributor
  { x: 8, y: 1.6, z: -86 }, // 6  end receiving: distributor floor
];

const GRAD = {
  blue: 'linear-gradient(135deg, #1a3a5c 0%, #0d1b2a 100%)',
  teal: 'linear-gradient(135deg, #00667a 0%, #003d4d 100%)',
  green: 'linear-gradient(135deg, #1a5a4a 0%, #0d3a30 100%)',
  amber: 'linear-gradient(135deg, #5a4a1a 0%, #3d2f0d 100%)',
  red: 'linear-gradient(135deg, #6a2a2a 0%, #4a1a1a 100%)',
  violet: 'linear-gradient(135deg, #2a2a5a 0%, #1a1a3a 100%)',
  steel: 'linear-gradient(135deg, #2a4050 0%, #1a2a3a 100%)',
};

export const STAGES: JourneyStage[] = [
  // ── 1. INBOUND ─────────────────────────────────────────────
  {
    phase: 1,
    label: 'STEP 01',
    phaseLabel: 'Inbound',
    title: 'Inbound — Barang Masuk',
    text: 'Truk tiba di loading dock. Setiap palet melewati RFID Gate dan otomatis terbaca, lalu dicocokkan dengan Purchase Order secara real-time.',
    camOffset: { x: 14, y: 5, z: 6 },
    fogDensity: 0.004,
    pins: [
      { id: 'in-gate', label: 'RFID Gate Inbound', world: { x: 8, y: 4.4, z: -8 }, title: 'RFID Gate Inbound', desc: 'Gawang membaca seluruh tag sekaligus tanpa perlu scan satu per satu.', imgBg: GRAD.teal },
      { id: 'in-truck', label: 'Truk Datang', world: { x: 8, y: 2.6, z: -16 }, title: 'Kedatangan Truk', desc: 'Palet diturunkan dari truk menuju area penerimaan gudang utama.', imgBg: GRAD.blue },
      { id: 'in-po', label: 'Verifikasi PO', world: { x: 4, y: 2.2, z: -2 }, title: 'Verifikasi Purchase Order', desc: 'Sistem mencocokkan barang masuk dengan dokumen pembelian secara otomatis.', imgBg: GRAD.steel },
    ],
  },

  // ── 2. PUTAWAY & STORAGE ───────────────────────────────────
  {
    phase: 2,
    label: 'STEP 02',
    phaseLabel: 'Penyimpanan',
    title: 'Putaway & Storage — Penyimpanan',
    text: 'Smart forklift berpengintai RFID meletakkan barang ke rak. Pasangan "Barang A → Rak B" terkunci otomatis dan stok ter-update real-time.',
    camOffset: { x: -5, y: 1.8, z: 4 },
    fogDensity: 0.001,
    pins: [
      { id: 'st-forklift', label: 'Smart Forklift', world: { x: 12, y: 2.2, z: 0 }, title: 'Smart Forklift / Handheld', desc: 'Forklift atau petugas dilengkapi RFID reader yang mengunci pasangan barang–lokasi saat penyimpanan.', imgBg: GRAD.amber },
      { id: 'st-loc', label: 'RFID Location Tag', world: { x: 18, y: 3.2, z: 2 }, title: 'Tag Lokasi Rak', desc: 'Setiap rak memiliki RFID location tag, sehingga sistem tahu persis di mana barang berada.', imgBg: GRAD.blue },
      { id: 'st-inv', label: 'Real-time Inventory', world: { x: 9, y: 6, z: -2 }, title: 'Inventory Real-time', desc: 'Visibilitas stok diperbarui real-time dengan akurasi hampir 100% — stock opname jadi mudah.', imgBg: GRAD.green },
    ],
  },

  // ── 3. ORDER PICKING ───────────────────────────────────────
  {
    phase: 3,
    label: 'STEP 03',
    phaseLabel: 'Picking',
    title: 'Order Picking — Pengambilan Pesanan',
    text: 'Pesanan masuk. Handheld RFID scanner bekerja seperti radar — berbunyi/bergetar makin cepat saat petugas mendekati barang yang dicari di rak padat.',
    camOffset: { x: -6, y: 1.5, z: 3 },
    fogDensity: 0.001,
    pins: [
      { id: 'pk-radar', label: 'Radar Pencarian', world: { x: 16, y: 2.8, z: 2 }, title: 'Pencarian Cepat (Radar)', desc: 'Scanner memandu petugas langsung ke barang yang tepat, bahkan di rak yang padat.', imgBg: GRAD.teal },
      { id: 'pk-valid', label: 'Validasi Anti-Salah', world: { x: 8, y: 2.2, z: -4 }, title: 'Validasi Anti-Salah', desc: 'Saat barang diangkat, reader memverifikasi kesesuaiannya dengan daftar pesanan.', imgBg: GRAD.green },
      { id: 'pk-stage', label: 'Area Staging', world: { x: 6, y: 1.8, z: -6 }, title: 'Konsolidasi Staging', desc: 'Barang terpilih dikumpulkan dan disiapkan menuju pintu keluar.', imgBg: GRAD.steel },
    ],
  },

  // ── 4. OUTBOUND ────────────────────────────────────────────
  {
    phase: 4,
    label: 'STEP 04',
    phaseLabel: 'Outbound',
    title: 'Outbound — Barang Keluar',
    text: 'Palet melewati RFID Gate Outbound. Sistem mencocokkan dengan PO distributor; bila salah/kurang, alarm menyala. Bila benar: stok terpotong, Surat Jalan tercetak, ASN terkirim.',
    camOffset: { x: 2, y: 2.5, z: -9 },
    fogDensity: 0.003,
    pins: [
      { id: 'out-gate', label: 'RFID Gate Outbound', world: { x: 8, y: 4.4, z: -8 }, title: 'RFID Gate Outbound', desc: 'Verifikasi otomatis seluruh muatan sebelum barang naik ke truk pengiriman.', imgBg: GRAD.teal },
      { id: 'out-alarm', label: 'Indikator & Alarm', world: { x: 11, y: 4.6, z: -8 }, title: 'Indikator & Alarm', desc: 'Lampu atau alarm di gawang menyala bila barang tertukar, salah ukuran, atau jumlahnya kurang.', imgBg: GRAD.red },
      { id: 'out-doc', label: 'Dokumen Otomatis', world: { x: 4, y: 3, z: -11 }, title: 'Dokumen Otomatis', desc: 'Stok terpotong, Surat Jalan (DO) tercetak, dan ASN dikirim digital ke distributor.', imgBg: GRAD.amber },
    ],
  },

  // ── 5. TRANSIT ─────────────────────────────────────────────
  {
    phase: 5,
    label: 'STEP 05',
    phaseLabel: 'Transit',
    title: 'Transit — Dalam Perjalanan',
    text: 'Status barang tercatat "In Transit". Distributor sudah bisa melihat rincian seri RFID yang sedang menuju lokasi mereka melalui data ASN.',
    camOffset: { x: 24, y: 13, z: 7 },
    fogDensity: 0.005,
    pins: [
      { id: 'tr-status', label: 'In Transit', world: { x: 8, y: 3.6, z: -46 }, title: 'Status In Transit', desc: 'Posisi dan isi muatan terpantau berdasarkan seri RFID sepanjang perjalanan.', imgBg: GRAD.violet },
      { id: 'tr-asn', label: 'Advance Shipping Notice', world: { x: 14, y: 5, z: -40 }, title: 'ASN Digital', desc: 'Distributor menyiapkan penerimaan lebih awal berkat data ASN yang dikirim dari gudang utama.', imgBg: GRAD.blue },
      { id: 'tr-vis', label: 'Visibilitas Rantai Pasok', world: { x: 2, y: 2.5, z: -32 }, title: 'Satu Sumber Kebenaran', desc: 'Pengirim dan penerima melihat status muatan yang sama secara real-time.', imgBg: GRAD.steel },
    ],
  },

  // ── 6. RECEIVING (DISTRIBUTOR) ─────────────────────────────
  {
    phase: 6,
    label: 'STEP 06',
    phaseLabel: 'Receiving',
    title: 'Receiving — Gudang Distributor',
    text: 'Truk tiba; palet melewati RFID Gate distributor. Sistem cross-check fisik dengan ASN, Proof of Delivery digital terjadi seketika, dan ERP pusat langsung memproses.',
    camOffset: { x: -15, y: 9, z: -13 },
    fogDensity: 0.004,
    pins: [
      { id: 'rc-gate', label: 'RFID Gate Distributor', world: { x: 8, y: 4.4, z: -80 }, title: 'Gate Distributor', desc: 'Penerimaan tanpa bongkar-muat manual — seluruh tag terbaca sekaligus saat palet lewat.', imgBg: GRAD.teal },
      { id: 'rc-sync', label: 'Sinkronisasi Instan', world: { x: 12, y: 3, z: -84 }, title: 'Cross-check Otomatis', desc: 'Sistem mencocokkan barang fisik dengan dokumen ASN digital dari gudang utama secara instan.', imgBg: GRAD.green },
      { id: 'rc-pod', label: 'Proof of Delivery', world: { x: 4, y: 3, z: -84 }, title: 'Proof of Delivery', desc: 'Bukti terima digital seketika; invoicing dan pencatatan ERP pusat langsung berjalan tanpa kertas.', imgBg: GRAD.violet },
    ],
  },
];

/** Smootherstep easing for buttery interpolation between waypoints. */
function smoother(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Hero pallet world position at journey progress p in [0,1]. */
export function heroAt(p: number): Vec3 {
  const N = STAGE_COUNT;
  const seg = Math.max(0, Math.min(1, p)) * N;
  const i = Math.min(N - 1, Math.floor(seg));
  const t = smoother(seg - i);
  const a = WAYPOINTS[i];
  const b = WAYPOINTS[i + 1];
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/** Stage index (0..5) for a given progress value. */
export function stageIndexAt(p: number): number {
  return Math.max(0, Math.min(STAGE_COUNT - 1, Math.floor(Math.max(0, Math.min(0.99999, p)) * STAGE_COUNT)));
}

/** Blended camera offset so framing eases between adjacent stages. */
export function camOffsetAt(p: number): Vec3 {
  const N = STAGE_COUNT;
  const seg = Math.max(0, Math.min(1, p)) * N;
  const i = Math.min(N - 1, Math.floor(seg));
  const j = Math.min(N - 1, i + 1);
  const t = smoother(seg - i);
  const a = STAGES[i].camOffset;
  const b = STAGES[j].camOffset;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

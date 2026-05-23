import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, X, ArrowRight, Circle, Star, Heart, AlertTriangle, 
  Download, Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon,
  Type, List, MessageSquareQuote, Sparkles, User, Palette,
  Bold, Italic, FileText, Layers, Copy, Upload, Wand2, Edit3,
  Settings, Menu, ChevronLeft, Smartphone, Monitor
} from 'lucide-react';

// ============ KONSTAN ============
const CANVAS_W = 1080;
const CANVAS_H = 1350;

const FONT_OPTIONS = [
  { name: 'Montserrat', stack: "'Montserrat', sans-serif" },
  { name: 'Poppins', stack: "'Poppins', sans-serif" },
  { name: 'Inter', stack: "'Inter', sans-serif" },
  { name: 'Playfair Display', stack: "'Playfair Display', serif" },
  { name: 'Lora', stack: "'Lora', serif" },
  { name: 'Nunito', stack: "'Nunito', sans-serif" },
];

const HIGHLIGHT_PRESETS = [
  { name: 'Pink', color: '#FECDD3' },
  { name: 'Kuning', color: '#FEF3C7' },
  { name: 'Hijau', color: '#D1FAE5' },
  { name: 'Biru', color: '#DBEAFE' },
  { name: 'Ungu', color: '#E9D5FF' },
  { name: 'Peach', color: '#FED7AA' },
];

const BG_PRESETS = [
  { name: 'Putih', value: '#FFFFFF' },
  { name: 'Krem', value: '#FFF9F0' },
  { name: 'Abu Soft', value: '#F5F5F4' },
  { name: 'Pink Pastel', value: '#FFF1F2' },
  { name: 'Biru Pastel', value: '#EFF6FF' },
  { name: 'Hijau Pastel', value: '#F0FDF4' },
];

const BULLET_ICONS = {
  'arrow-right': { label: '→', Icon: ArrowRight, color: '#16A34A' },
  'check': { label: '✓', Icon: Check, color: '#16A34A' },
  'x': { label: '✗', Icon: X, color: '#DC2626' },
  'circle': { label: '●', Icon: Circle, color: '#3B82F6' },
  'star': { label: '★', Icon: Star, color: '#F59E0B' },
  'heart': { label: '♥', Icon: Heart, color: '#EC4899' },
  'warning': { label: '!', Icon: AlertTriangle, color: '#F59E0B' },
};

const fontLink = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');`;

const uid = () => Math.random().toString(36).slice(2, 10);

// Default global settings
const DEFAULT_SETTINGS = {
  paddingX: 96,        // jarak kiri-kanan
  paddingTop: 80,      // jarak dari atas (username area)
  gapAfterHeader: 64,  // jarak username ke konten (= jarak footer ke konten)
  lineHeight: 1.3,     // line height global
  blockGap: 32,        // jarak antar block
};

// Default starter blocks
const defaultBlocks = () => [
  {
    id: uid(),
    type: 'heading',
    text: '"Jangan asal TERAPI GURAH LENDIR, apalagi pada anak."',
    font: 'Montserrat',
    color: '#7F1D1D',
    size: 62,
    weight: 800,
    align: 'left',
  },
  {
    id: uid(),
    type: 'paragraph',
    text: 'Secara ilmiah, terapi gurah lendir <mark style="background:#FECDD3; padding:2px 8px; border-radius:4px">TIDAK direkomendasikan</mark> sebagai terapi standar medis.',
    font: 'Montserrat',
    color: '#111827',
    size: 32,
    weight: 400,
    align: 'left',
  },
  {
    id: uid(),
    type: 'bullets',
    icon: 'arrow-right',
    iconColor: '#16A34A',
    items: ['Iritasi & trauma mukosa', 'Mimisan', 'Infeksi', 'Gangguan telinga/sinus'],
    font: 'Montserrat',
    color: '#111827',
    size: 30,
    weight: 400,
  },
  {
    id: uid(),
    type: 'callout',
    text: '<b>Yang perlu dipahami:</b> Lendir berlebihan biasanya adalah "gejala", bukan penyakit utama.',
    bgColor: '#DBEAFE',
    borderColor: '#3B82F6',
    color: '#111827',
    font: 'Montserrat',
    size: 30,
    weight: 400,
  },
];

// ============ KOMPONEN: Render Block ============
function RenderBlock({ block, settings }) {
  const fontStack = FONT_OPTIONS.find(f => f.name === block.font)?.stack || FONT_OPTIONS[0].stack;
  const commonStyle = {
    fontFamily: fontStack,
    color: block.color,
    fontSize: block.size + 'px',
    fontWeight: block.weight,
    lineHeight: settings.lineHeight,
    textAlign: block.align || 'left',
  };

  if (block.type === 'heading') {
    return <div style={{ ...commonStyle, marginBottom: settings.blockGap }} dangerouslySetInnerHTML={{ __html: block.text }} />;
  }
  if (block.type === 'paragraph') {
    return <div style={{ ...commonStyle, marginBottom: settings.blockGap }} dangerouslySetInnerHTML={{ __html: block.text }} />;
  }
  if (block.type === 'bullets') {
    const iconConf = BULLET_ICONS[block.icon] || BULLET_ICONS['arrow-right'];
    const Icon = iconConf.Icon;
    return (
      <div style={{ marginBottom: settings.blockGap }}>
        {block.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 999,
              background: block.iconColor || iconConf.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 6,
            }}>
              <Icon size={22} color="#fff" strokeWidth={3} />
            </div>
            <div style={commonStyle} dangerouslySetInnerHTML={{ __html: item }} />
          </div>
        ))}
      </div>
    );
  }
  if (block.type === 'callout') {
    return (
      <div style={{
        background: block.bgColor,
        borderLeft: `8px solid ${block.borderColor}`,
        padding: '24px 28px',
        borderRadius: 12,
        marginBottom: settings.blockGap,
      }}>
        <div style={commonStyle} dangerouslySetInnerHTML={{ __html: block.text }} />
      </div>
    );
  }
  if (block.type === 'image') {
    const radius = block.shape === 'rounded' ? 20 : block.shape === 'circle' ? 9999 : 0;
    return (
      <div style={{ marginBottom: settings.blockGap, display: 'flex', justifyContent: block.align || 'center' }}>
        <img src={block.src} alt="" style={{
          maxWidth: '100%', width: block.width || '70%',
          aspectRatio: block.aspectRatio || 'auto', objectFit: 'cover',
          borderRadius: radius,
        }} />
      </div>
    );
  }
  return null;
}

// ============ KOMPONEN: Slide Canvas ============
const SlideCanvas = React.forwardRef(({ slide, profile, footer, settings, pageIndex, totalPages }, ref) => {
  // Hitung tinggi minimum untuk header dan footer
  const headerH = 64 + 16; // tinggi avatar + line-height nama
  const footerH = footer && footer.trim() ? Math.max(60, footer.split('\n').length * 22) : 0;
  
  // Konten body harus center-ish, dengan jarak sama dari atas-bawah konten
  const symmetricGap = settings.gapAfterHeader;
  
  return (
    <div
      ref={ref}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        background: slide.bg || '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Montserrat', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header identity */}
      <div style={{ 
        padding: `${settings.paddingTop}px ${settings.paddingX}px 0`, 
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 9999, overflow: 'hidden',
          background: '#E5E7EB', flexShrink: 0,
          backgroundImage: profile.avatar ? `url(${profile.avatar})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', fontFamily: "'Montserrat', sans-serif" }}>
          {profile.name}
        </div>
        {profile.verified && (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#3B82F6">
            <path d="M12 2l2.4 2.8L18 4l.6 3.6L22 9l-1.4 3.4L22 16l-3.4 1.4L18 21l-3.6-.6L12 23l-2.4-2.6L6 21l-.6-3.6L2 16l1.4-3.4L2 9l3.4-1.4L6 4l3.6.6L12 2z" />
            <path d="M9 12.5l2 2 4-4.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Body — center vertically, dengan jarak simetris dari header dan footer */}
      <div style={{ 
        flex: 1,
        padding: `${symmetricGap}px ${settings.paddingX}px ${symmetricGap}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {slide.blocks.map(block => (
          <RenderBlock key={block.id} block={block} settings={settings} />
        ))}
      </div>

      {/* Footer — fixed di bawah dengan padding sama dari konten */}
      {footer && footer.trim() && (
        <div style={{
          padding: `0 ${settings.paddingX}px ${settings.paddingTop * 0.6}px`,
          fontSize: 16, color: '#6B7280', fontStyle: 'italic',
          lineHeight: 1.5, whiteSpace: 'pre-line',
          fontFamily: "'Montserrat', sans-serif",
        }}>
          {footer}
        </div>
      )}

      {/* Page indicator carousel */}
      {totalPages > 1 && (
        <div style={{
          position: 'absolute', right: 36, bottom: 24,
          fontSize: 18, color: '#9CA3AF', fontWeight: 600,
          fontFamily: "'Montserrat', sans-serif",
          background: 'rgba(255,255,255,0.7)',
          padding: '4px 12px', borderRadius: 999,
        }}>
          {pageIndex + 1} / {totalPages}
        </div>
      )}
    </div>
  );
});

// ============ MAIN APP ============
export default function App() {
  const [mode, setMode] = useState('ai'); // 'ai' | 'manual'
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('canvas'); // 'canvas' | 'left' | 'right'

  const [profile, setProfile] = useState({
    name: 'ardisantoso',
    verified: true,
    avatar: null,
  });
  const [footer, setFooter] = useState('Referensi:\n1. American Academy of Pediatrics (AAP)\n2. AAO-HNS Guideline Rhinosinusitis\n3. WHO IMCI');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [slides, setSlides] = useState([
    { id: uid(), bg: '#FFFFFF', blocks: defaultBlocks() },
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const canvasRefs = useRef({});

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Compute preview scale dynamically
  const [previewScale, setPreviewScale] = useState(0.42);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 600) setPreviewScale(Math.min(0.32, (w - 60) / CANVAS_W));
      else if (w < 900) setPreviewScale(Math.min(0.38, (w - 80) / CANVAS_W));
      else setPreviewScale(0.42);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const currentSlide = slides[activeSlide];
  const selectedBlock = currentSlide?.blocks.find(b => b.id === selectedBlockId);

  // ===== Slide ops =====
  const addSlide = () => {
    setSlides([...slides, { id: uid(), bg: '#FFFFFF', blocks: [] }]);
    setActiveSlide(slides.length);
  };
  const duplicateSlide = (idx) => {
    const orig = slides[idx];
    const clone = { ...orig, id: uid(), blocks: orig.blocks.map(b => ({ ...b, id: uid() })) };
    const newSlides = [...slides];
    newSlides.splice(idx + 1, 0, clone);
    setSlides(newSlides);
    setActiveSlide(idx + 1);
  };
  const deleteSlide = (idx) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    setActiveSlide(Math.max(0, Math.min(activeSlide, newSlides.length - 1)));
  };

  // ===== Block ops =====
  const updateBlock = (blockId, updates) => {
    setSlides(slides.map((s, i) => {
      if (i !== activeSlide) return s;
      return { ...s, blocks: s.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b) };
    }));
  };
  const addBlock = (type) => {
    const base = { font: 'Montserrat', color: '#111827' };
    let newBlock;
    if (type === 'heading') newBlock = { id: uid(), type: 'heading', text: 'Judul', size: 56, weight: 700, align: 'left', ...base };
    else if (type === 'paragraph') newBlock = { id: uid(), type: 'paragraph', text: 'Paragraf...', size: 32, weight: 400, align: 'left', ...base };
    else if (type === 'bullets') newBlock = { id: uid(), type: 'bullets', items: ['Poin 1', 'Poin 2'], icon: 'arrow-right', iconColor: '#16A34A', size: 30, weight: 400, ...base };
    else if (type === 'callout') newBlock = { id: uid(), type: 'callout', text: 'Catatan penting', bgColor: '#DBEAFE', borderColor: '#3B82F6', size: 30, weight: 400, ...base };
    else if (type === 'image') newBlock = { id: uid(), type: 'image', src: '', shape: 'rounded', width: '70%', align: 'center' };

    setSlides(slides.map((s, i) => i !== activeSlide ? s : { ...s, blocks: [...s.blocks, newBlock] }));
    setSelectedBlockId(newBlock.id);
  };
  const deleteBlock = (blockId) => {
    setSlides(slides.map((s, i) => i !== activeSlide ? s : { ...s, blocks: s.blocks.filter(b => b.id !== blockId) }));
    setSelectedBlockId(null);
  };
  const moveBlock = (blockId, dir) => {
    setSlides(slides.map((s, i) => {
      if (i !== activeSlide) return s;
      const idx = s.blocks.findIndex(b => b.id === blockId);
      if (idx < 0) return s;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= s.blocks.length) return s;
      const newBlocks = [...s.blocks];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      return { ...s, blocks: newBlocks };
    }));
  };

  // ===== Format =====
  const applyHighlight = (color) => document.execCommand('hiliteColor', false, color);
  const applyBold = () => document.execCommand('bold');
  const applyItalic = () => document.execCommand('italic');
  const clearFormatting = () => document.execCommand('removeFormat');

  // ===== Uploads =====
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile({ ...profile, avatar: ev.target.result });
    reader.readAsDataURL(file);
  };
  const handleImageUpload = (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateBlock(blockId, { src: ev.target.result });
    reader.readAsDataURL(file);
  };

  // ===== AI Auto-layout =====
  const handleAIProcess = async () => {
    if (!aiInputText.trim()) return;
    setIsProcessingAI(true);
    try {
      const prompt = `Kamu adalah AI desainer konten edukasi kesehatan untuk Instagram (akun dr. Ardi Santoso, dokter spesialis anak).

INPUT MENTAH dari user (mungkin typo, struktur acak, tidak rapi):
"""
${aiInputText}
"""

TUGAS:
1. Perbaiki SEMUA typo, ejaan EYD, dan tata bahasa Bahasa Indonesia.
2. Identifikasi struktur konten: mana judul, penjelasan, daftar poin, kutipan/penekanan, referensi.
3. Pisahkan menjadi BEBERAPA SLIDE jika konten panjang (target 1 slide IG 1080x1350 dengan font readable).
4. Untuk setiap slide, susun blocks dalam urutan logis.
5. PILIH SECARA CERDAS jenis block:
   - "heading": judul utama slide (1 per slide, di awal, singkat & kuat)
   - "paragraph": penjelasan naratif
   - "bullets": daftar 3+ item (icon: check untuk hal positif, x untuk negatif, arrow-right untuk netral, star untuk highlight, warning untuk peringatan)
   - "callout": kotak penekanan untuk insight/kutipan penting
6. Untuk paragraph, tambahkan HIGHLIGHTS pada 1-3 frasa kunci (jangan terlalu banyak, max 3 per paragraf).
7. Identifikasi referensi/sumber → masukkan ke "footer".

FORMAT OUTPUT (JSON murni, tanpa markdown fence, tanpa penjelasan):

{
  "slides": [
    {
      "blocks": [
        { "type": "heading", "text": "..." },
        { "type": "paragraph", "text": "...", "highlights": [{ "phrase": "frasa di teks", "color": "#FECDD3" }] },
        { "type": "bullets", "icon": "check|x|arrow-right|star|warning|heart", "items": ["...", "..."] },
        { "type": "callout", "text": "...", "bgColor": "#DBEAFE" }
      ]
    }
  ],
  "footer": "referensi atau catatan kaki kecil, atau null"
}

WARNA HIGHLIGHT (pilih yang cocok dengan konteks):
- #FECDD3 (pink) → peringatan, larangan, kata kunci risiko
- #FEF3C7 (kuning) → penekanan, perhatian
- #D1FAE5 (hijau) → hal positif, rekomendasi
- #DBEAFE (biru) → informasi netral, fakta
- #E9D5FF (ungu) → solusi, alternatif
- #FED7AA (peach) → fokus utama

ATURAN TAMBAHAN:
- Maksimal 4-5 blocks per slide supaya muat dan readable.
- Jika ada list 3+ item, GUNAKAN bullets (jangan paragraf panjang).
- Jika ada penekanan atau insight ringkas, GUNAKAN callout (jangan paragraf).
- Heading jangan lebih dari 12 kata.
- Konten harus ringkas dan padat — buang kata yang tidak perlu.

Output HANYA JSON valid.`;

      // Server-side /api/generate sudah handle prompt building dan parsing
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInputText }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      const parsed = await resp.json();

      // Convert parsed slides to app slides
      const newSlides = parsed.slides.map(s => ({
        id: uid(),
        bg: '#FFFFFF',
        blocks: s.blocks.map(b => {
          if (b.type === 'heading') {
            return { id: uid(), type: 'heading', text: b.text, font: 'Montserrat', color: '#7F1D1D', size: 60, weight: 800, align: 'left' };
          }
          if (b.type === 'paragraph') {
            let text = b.text;
            if (b.highlights && Array.isArray(b.highlights)) {
              b.highlights.forEach(h => {
                const re = new RegExp(h.phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
                text = text.replace(re, `<mark style="background:${h.color}; padding:2px 8px; border-radius:4px">${h.phrase}</mark>`);
              });
            }
            return { id: uid(), type: 'paragraph', text, font: 'Montserrat', color: '#111827', size: 32, weight: 400, align: 'left' };
          }
          if (b.type === 'bullets') {
            const iconConf = BULLET_ICONS[b.icon] || BULLET_ICONS['arrow-right'];
            return { id: uid(), type: 'bullets', items: b.items, icon: b.icon || 'arrow-right', iconColor: iconConf.color, font: 'Montserrat', color: '#111827', size: 30, weight: 400 };
          }
          if (b.type === 'callout') {
            return { id: uid(), type: 'callout', text: b.text, bgColor: b.bgColor || '#DBEAFE', borderColor: '#3B82F6', font: 'Montserrat', color: '#111827', size: 30, weight: 400 };
          }
          return null;
        }).filter(Boolean),
      }));

      setSlides(newSlides);
      setActiveSlide(0);
      if (parsed.footer) setFooter(parsed.footer);
      setShowAIModal(false);
      setAiInputText('');
    } catch (err) {
      alert('Gagal proses AI: ' + err.message);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ===== EXPORT PNG =====
  const exportSlide = async (slideIdx) => {
    const node = canvasRefs.current[slideIdx];
    if (!node) return;

    const clone = node.cloneNode(true);
    const styleEl = document.createElement('style');
    styleEl.textContent = fontLink;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', svgNS);
    svg.setAttribute('width', CANVAS_W);
    svg.setAttribute('height', CANVAS_H);
    svg.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);

    const fo = document.createElementNS(svgNS, 'foreignObject');
    fo.setAttribute('width', '100%');
    fo.setAttribute('height', '100%');

    const wrap = document.createElement('div');
    wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    wrap.appendChild(styleEl);
    wrap.appendChild(clone);
    fo.appendChild(wrap);
    svg.appendChild(fo);

    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);

    URL.revokeObjectURL(url);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `${profile.name}-slide-${slideIdx + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
  };

  const exportAll = async () => {
    // Render off-screen semua slide
    for (let i = 0; i < slides.length; i++) {
      const prev = activeSlide;
      setActiveSlide(i);
      await new Promise(r => setTimeout(r, 200));
      await exportSlide(i);
      await new Promise(r => setTimeout(r, 200));
    }
  };

  // ============ RENDER ============
  const isCanvasView = !isMobile || mobilePanel === 'canvas';
  const isLeftView = isMobile && mobilePanel === 'left';
  const isRightView = isMobile && mobilePanel === 'right';

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#E2E8F0' }}>
      <style>{fontLink}</style>
      <style>{`
        body { margin: 0; -webkit-font-smoothing: antialiased; }
        .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroll-thin::-webkit-scrollbar-track { background: #1E293B; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        [contenteditable]:focus { outline: 2px solid #3B82F6; outline-offset: 2px; }
        mark { padding: 2px 6px; border-radius: 4px; }
        button { font-family: 'Montserrat', sans-serif; }
        input, select, textarea { font-family: 'Montserrat', sans-serif; }
      `}</style>

      {/* ===== TOP BAR ===== */}
      <div style={{
        background: '#1E293B', padding: isMobile ? '10px 12px' : '14px 20px',
        borderBottom: '1px solid #334155',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && (
            <button
              onClick={() => setMobilePanel(mobilePanel === 'left' ? 'canvas' : 'left')}
              style={mobileTabBtn(mobilePanel === 'left')}
            >
              <Menu size={18} />
            </button>
          )}
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={18} color="#fff" />
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Feed Studio</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>by Joyboy</div>
            </div>
          )}
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', background: '#0F172A', padding: 3, borderRadius: 8, gap: 2 }}>
          <button
            onClick={() => setMode('ai')}
            style={{
              background: mode === 'ai' ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'transparent',
              color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Wand2 size={13} /> AI Auto
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{
              background: mode === 'manual' ? '#3B82F6' : 'transparent',
              color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Edit3 size={13} /> Manual
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
{mode === 'ai' && (
            <button
              onClick={() => setShowAIModal(true)}
              style={topBtnStyle('linear-gradient(135deg, #8B5CF6, #EC4899)')}
            >
              <Sparkles size={14} /> {!isMobile && 'Generate'}
            </button>
          )}
          <button onClick={exportAll} style={topBtnStyle('#10B981')}>
            <Download size={14} /> {!isMobile && 'Export'}
          </button>
          {isMobile && (
            <button
              onClick={() => setMobilePanel(mobilePanel === 'right' ? 'canvas' : 'right')}
              style={mobileTabBtn(mobilePanel === 'right')}
              title="Block editor"
            >
              <Edit3 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 320px',
        height: 'calc(100vh - 60px)',
      }}>
        
        {/* ===== LEFT SIDEBAR ===== */}
        {(!isMobile || isLeftView) && (
          <div className="scroll-thin" style={{
            background: '#1E293B', padding: 16, overflowY: 'auto',
            borderRight: !isMobile ? '1px solid #334155' : 'none',
          }}>
            <SectionTitle icon={User} text="Identitas" />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <label style={{
                width: 54, height: 54, borderRadius: 999, background: '#334155',
                backgroundImage: profile.avatar ? `url(${profile.avatar})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {!profile.avatar && <Upload size={16} color="#94A3B8" />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </label>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  style={inputStyle}
                  placeholder="Username"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={profile.verified} onChange={e => setProfile({ ...profile, verified: e.target.checked })} />
                  Centang biru
                </label>
              </div>
            </div>

            <SectionTitle icon={Palette} text="Background Slide" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 18 }}>
              {BG_PRESETS.map(bg => (
                <button
                  key={bg.value}
                  onClick={() => {
                    const newSlides = [...slides];
                    newSlides[activeSlide] = { ...newSlides[activeSlide], bg: bg.value };
                    setSlides(newSlides);
                  }}
                  style={{
                    background: bg.value, height: 36, borderRadius: 6,
                    border: currentSlide?.bg === bg.value ? '2px solid #3B82F6' : '1px solid #334155',
                    cursor: 'pointer', fontSize: 9, color: '#0F172A', fontWeight: 700,
                  }}
                >
                  {bg.name}
                </button>
              ))}
            </div>

            {/* GLOBAL SETTINGS */}
            <SectionTitle icon={Settings} text="Layout (Semua Slide)" />
            <SliderField
              label="Margin Kiri/Kanan"
              value={settings.paddingX}
              min={48} max={160} step={8}
              onChange={v => setSettings({ ...settings, paddingX: v })}
              unit="px"
            />
            <SliderField
              label="Jarak Atas (Username)"
              value={settings.paddingTop}
              min={48} max={140} step={4}
              onChange={v => setSettings({ ...settings, paddingTop: v })}
              unit="px"
            />
            <SliderField
              label="Jarak Header ↔ Konten"
              value={settings.gapAfterHeader}
              min={32} max={140} step={4}
              onChange={v => setSettings({ ...settings, gapAfterHeader: v })}
              unit="px"
              hint="= jarak footer ke konten"
            />
            <SliderField
              label="Spasi Baris (Line Height)"
              value={settings.lineHeight}
              min={1.0} max={2.0} step={0.05}
              onChange={v => setSettings({ ...settings, lineHeight: v })}
              unit=""
            />
            <SliderField
              label="Jarak Antar Block"
              value={settings.blockGap}
              min={12} max={80} step={4}
              onChange={v => setSettings({ ...settings, blockGap: v })}
              unit="px"
            />
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              style={{ ...inputStyle, background: '#334155', cursor: 'pointer', marginTop: 6, marginBottom: 18 }}
            >
              Reset Default
            </button>

            <SectionTitle icon={FileText} text="Catatan Kaki" />
            <textarea
              value={footer}
              onChange={e => setFooter(e.target.value)}
              rows={4}
              style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Referensi..."
            />

            <div style={{ marginTop: 20 }}>
              <SectionTitle icon={Layers} text={`Slides (${slides.length})`} />
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSlide(i); if (isMobile) setMobilePanel('canvas'); }}
                  style={{
                    padding: 8, marginBottom: 5, borderRadius: 6,
                    background: activeSlide === i ? '#3B82F6' : '#0F172A',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 13, fontWeight: 500,
                  }}
                >
                  <span>Slide {i + 1}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} style={iconBtnStyle}>
                      <Copy size={11} />
                    </button>
                    {slides.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} style={iconBtnStyle}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={addSlide}
                style={{
                  width: '100%', padding: 8, background: 'transparent',
                  border: '1px dashed #475569', color: '#94A3B8', borderRadius: 6,
                  cursor: 'pointer', marginTop: 6, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <Plus size={14} /> Tambah Slide
              </button>
            </div>
          </div>
        )}

        {/* ===== CENTER: Canvas ===== */}
        {isCanvasView && (
          <div className="scroll-thin" style={{ overflow: 'auto', padding: isMobile ? 12 : 24, background: '#0F172A' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Block insert toolbar (manual mode) */}
              {mode === 'manual' && (
                <div style={{
                  display: 'flex', gap: 4, background: '#1E293B', padding: 6, borderRadius: 10,
                  border: '1px solid #334155', flexWrap: 'wrap', justifyContent: 'center',
                }}>
                  <ToolButton onClick={() => addBlock('heading')} icon={Type} label="Judul" />
                  <ToolButton onClick={() => addBlock('paragraph')} icon={FileText} label="Paragraf" />
                  <ToolButton onClick={() => addBlock('bullets')} icon={List} label="Bullet" />
                  <ToolButton onClick={() => addBlock('callout')} icon={MessageSquareQuote} label="Callout" />
                  <ToolButton onClick={() => addBlock('image')} icon={ImageIcon} label="Gambar" />
                </div>
              )}

              {mode === 'ai' && (
                <button
                  onClick={() => setShowAIModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12,
                    fontWeight: 700, cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Wand2 size={16} /> Tempel Teks & Generate Otomatis
                </button>
              )}

              {/* Slide indicator */}
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                Slide {activeSlide + 1} / {slides.length} · 1080×1350 px
              </div>

              {/* Canvas */}
              <div style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
                width: CANVAS_W,
                height: CANVAS_H,
                marginBottom: -CANVAS_H * (1 - previewScale),
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}>
                <SlideCanvas
                  ref={(el) => (canvasRefs.current[activeSlide] = el)}
                  slide={currentSlide}
                  profile={profile}
                  footer={footer}
                  settings={settings}
                  pageIndex={activeSlide}
                  totalPages={slides.length}
                />
              </div>

              {/* Slide nav arrows for carousel preview */}
              {slides.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                    style={{ ...navBtnStyle, opacity: activeSlide === 0 ? 0.4 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => exportSlide(activeSlide)}
                    style={{ ...navBtnStyle, background: '#10B981' }}
                  >
                    <Download size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Slide Ini
                  </button>
                  <button
                    onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                    disabled={activeSlide === slides.length - 1}
                    style={{ ...navBtnStyle, opacity: activeSlide === slides.length - 1 ? 0.4 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== RIGHT SIDEBAR: Block Editor (manual mode) ===== */}
        {(!isMobile || isRightView) && (
          <div className="scroll-thin" style={{
            background: '#1E293B', padding: 16, overflowY: 'auto',
            borderLeft: !isMobile ? '1px solid #334155' : 'none',
          }}>
            <SectionTitle icon={Layers} text="Block di Slide Ini" />
            {currentSlide.blocks.length === 0 && (
              <div style={{ color: '#64748B', fontSize: 12, padding: 14, textAlign: 'center', border: '1px dashed #334155', borderRadius: 8 }}>
                {mode === 'ai' ? 'Pakai mode AI Auto untuk generate konten otomatis dari teks mentah.' : 'Tambahkan block dari toolbar di atas canvas.'}
              </div>
            )}
            {currentSlide.blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                style={{
                  padding: 9, marginBottom: 6, borderRadius: 7,
                  background: selectedBlockId === block.id ? '#1E40AF' : '#0F172A',
                  cursor: 'pointer', fontSize: 12,
                  border: selectedBlockId === block.id ? '1px solid #3B82F6' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, color: '#94A3B8' }}>
                    {block.type}
                  </span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} style={iconBtnStyle}><ChevronUp size={11} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} style={iconBtnStyle}><ChevronDown size={11} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} style={iconBtnStyle}><Trash2 size={11} /></button>
                  </div>
                </div>
                <div style={{ color: '#CBD5E1', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {block.type === 'bullets' ? `${block.items.length} poin` :
                   block.type === 'image' ? (block.src ? '✓ Ada gambar' : 'Belum upload') :
                   (block.text || '').replace(/<[^>]+>/g, '').slice(0, 50)}
                </div>
              </div>
            ))}

            {/* ===== BLOCK DETAIL EDITOR ===== */}
            {selectedBlock && (
              <div style={{
                marginTop: 16, padding: 12, background: '#0F172A', borderRadius: 8,
                border: '1px solid #334155',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#F1F5F9', textTransform: 'uppercase' }}>
                  Edit {selectedBlock.type}
                </div>

                {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph' || selectedBlock.type === 'callout') && (
                  <>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
                      <button onMouseDown={(e) => { e.preventDefault(); applyBold(); }} style={fmtBtn}><Bold size={13} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); applyItalic(); }} style={fmtBtn}><Italic size={13} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} style={fmtBtn}>×</button>
                    </div>
                    <Label text="Stabilo (pilih teks dulu)" />
                    <div style={{ display: 'flex', gap: 3, marginBottom: 10, flexWrap: 'wrap' }}>
                      {HIGHLIGHT_PRESETS.map(h => (
                        <button
                          key={h.color}
                          onMouseDown={(e) => { e.preventDefault(); applyHighlight(h.color); }}
                          style={{ width: 26, height: 26, borderRadius: 5, background: h.color, border: 'none', cursor: 'pointer' }}
                          title={h.name}
                        />
                      ))}
                    </div>

                    <Label text="Teks" />
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateBlock(selectedBlock.id, { text: e.currentTarget.innerHTML })}
                      dangerouslySetInnerHTML={{ __html: selectedBlock.text }}
                      style={{
                        background: '#1E293B', color: '#E2E8F0', padding: 9, borderRadius: 6,
                        minHeight: 80, fontSize: 12, lineHeight: 1.5, border: '1px solid #334155',
                        marginBottom: 8,
                      }}
                    />
                  </>
                )}

                {selectedBlock.type === 'bullets' && (
                  <>
                    <Label text="Icon" />
                    <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
                      {Object.entries(BULLET_ICONS).map(([key, conf]) => (
                        <button
                          key={key}
                          onClick={() => updateBlock(selectedBlock.id, { icon: key, iconColor: conf.color })}
                          style={{
                            width: 32, height: 32, borderRadius: 7,
                            background: selectedBlock.icon === key ? conf.color : '#334155',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <conf.Icon size={14} />
                        </button>
                      ))}
                    </div>
                    <Label text="Warna icon" />
                    <input
                      type="color"
                      value={selectedBlock.iconColor}
                      onChange={e => updateBlock(selectedBlock.id, { iconColor: e.target.value })}
                      style={{ width: '100%', height: 32, marginBottom: 10, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                    />
                    <Label text="Item" />
                    {selectedBlock.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                        <input
                          type="text"
                          value={item}
                          onChange={e => {
                            const newItems = [...selectedBlock.items];
                            newItems[i] = e.target.value;
                            updateBlock(selectedBlock.id, { items: newItems });
                          }}
                          style={inputStyle}
                        />
                        <button
                          onClick={() => {
                            const newItems = selectedBlock.items.filter((_, idx) => idx !== i);
                            updateBlock(selectedBlock.id, { items: newItems });
                          }}
                          style={iconBtnStyle}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(selectedBlock.id, { items: [...selectedBlock.items, 'Poin baru'] })}
                      style={{ ...inputStyle, background: '#334155', cursor: 'pointer', textAlign: 'center', marginTop: 4 }}
                    >
                      + Tambah Poin
                    </button>
                  </>
                )}

                {selectedBlock.type === 'callout' && (
                  <>
                    <Label text="BG Callout" />
                    <div style={{ display: 'flex', gap: 3, marginBottom: 10, flexWrap: 'wrap' }}>
                      {HIGHLIGHT_PRESETS.map(h => (
                        <button
                          key={h.color}
                          onClick={() => updateBlock(selectedBlock.id, { bgColor: h.color })}
                          style={{
                            width: 28, height: 28, borderRadius: 5, background: h.color,
                            border: selectedBlock.bgColor === h.color ? '2px solid #fff' : '1px solid #334155',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                    <Label text="Border" />
                    <input
                      type="color"
                      value={selectedBlock.borderColor}
                      onChange={e => updateBlock(selectedBlock.id, { borderColor: e.target.value })}
                      style={{ width: '100%', height: 32, marginBottom: 10, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                    />
                  </>
                )}

                {selectedBlock.type === 'image' && (
                  <>
                    <Label text="Upload" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, selectedBlock.id)}
                      style={{ marginBottom: 8, fontSize: 11, color: '#CBD5E1' }}
                    />
                    <Label text="Bentuk" />
                    <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                      {['sharp', 'rounded', 'circle'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateBlock(selectedBlock.id, { shape: s })}
                          style={{
                            ...inputStyle,
                            background: selectedBlock.shape === s ? '#3B82F6' : '#334155',
                            cursor: 'pointer', textAlign: 'center', fontSize: 11,
                          }}
                        >
                          {s === 'sharp' ? 'Tajam' : s === 'rounded' ? 'Rounded' : 'Bulat'}
                        </button>
                      ))}
                    </div>
                    <Label text="Lebar" />
                    <input
                      type="text"
                      value={selectedBlock.width || '70%'}
                      onChange={e => updateBlock(selectedBlock.id, { width: e.target.value })}
                      style={inputStyle}
                    />
                  </>
                )}

                {selectedBlock.type !== 'image' && (
                  <>
                    <Label text="Font" />
                    <select
                      value={selectedBlock.font}
                      onChange={e => updateBlock(selectedBlock.id, { font: e.target.value })}
                      style={inputStyle}
                    >
                      {FONT_OPTIONS.map(f => (<option key={f.name} value={f.name}>{f.name}</option>))}
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                      <div>
                        <Label text="Ukuran" />
                        <input
                          type="number"
                          value={selectedBlock.size}
                          onChange={e => updateBlock(selectedBlock.id, { size: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <Label text="Weight" />
                        <select
                          value={selectedBlock.weight}
                          onChange={e => updateBlock(selectedBlock.id, { weight: Number(e.target.value) })}
                          style={inputStyle}
                        >
                          {[300, 400, 500, 600, 700, 800].map(w => <option key={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>

                    <Label text="Warna" />
                    <input
                      type="color"
                      value={selectedBlock.color}
                      onChange={e => updateBlock(selectedBlock.id, { color: e.target.value })}
                      style={{ width: '100%', height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== AI MODAL ===== */}
      {showAIModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
          <div style={{
            background: '#1E293B', padding: 20, borderRadius: 16, width: 640, maxWidth: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid #475569',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Wand2 size={20} color="#A78BFA" />
              <div style={{ fontWeight: 700, fontSize: 16, color: '#F1F5F9' }}>
                AI Auto-Layout
              </div>
            </div>
            <p style={{ color: '#94A3B8', fontSize: 12.5, marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>
              Tempel teks mentah apa adanya. AI akan:
              <br />→ Perbaiki typo & tata bahasa
              <br />→ Pisahkan jadi beberapa slide carousel kalau panjang
              <br />→ Pilih struktur (paragraf / bullet / callout) per bagian
              <br />→ Highlight kata kunci penting otomatis
              <br />→ Ekstrak referensi ke catatan kaki
            </p>
            <textarea
              value={aiInputText}
              onChange={e => setAiInputText(e.target.value)}
              rows={isMobile ? 8 : 11}
              placeholder="Contoh: tempel naskah edukasi mentah dari dr. Ardi, dengan typo dan struktur acak, biarkan AI yang rapikan..."
              style={{
                width: '100%', background: '#0F172A', color: '#E2E8F0',
                padding: 10, borderRadius: 8, border: '1px solid #334155',
                fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={() => setShowAIModal(false)}
                style={{
                  padding: '9px 16px', background: '#334155', color: '#E2E8F0',
                  border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
                }}
              >
                Batal
              </button>
              <button
                onClick={handleAIProcess}
                disabled={isProcessingAI || !aiInputText.trim()}
                style={{
                  padding: '9px 18px',
                  background: isProcessingAI ? '#475569' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600,
                  cursor: isProcessingAI ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                }}
              >
                {isProcessingAI ? 'Memproses...' : <><Sparkles size={13} /> Generate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ KOMPONEN BANTU ============
function SectionTitle({ icon: Icon, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
      fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      <Icon size={12} /> {text}
    </div>
  );
}

function Label({ text }) {
  return (
    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3, marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
      {text}
    </div>
  );
}

function ToolButton({ onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', color: '#E2E8F0', border: 'none',
        padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );
}

function SliderField({ label, value, min, max, step, onChange, unit, hint }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <label style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600 }}>{label}</label>
        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#3B82F6' }}
      />
      {hint && <div style={{ fontSize: 9.5, color: '#64748B', fontStyle: 'italic', marginTop: 1 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: '#0F172A', color: '#E2E8F0',
  padding: '7px 9px', borderRadius: 5, border: '1px solid #334155',
  fontSize: 12, boxSizing: 'border-box',
};

const iconBtnStyle = {
  background: '#334155', color: '#E2E8F0', border: 'none',
  width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const fmtBtn = {
  background: '#334155', color: '#E2E8F0', border: 'none',
  width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700,
};

const topBtnStyle = (bg) => ({
  background: bg, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8,
  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 12,
});

const mobileTabBtn = (active) => ({
  background: active ? '#3B82F6' : '#334155', color: '#fff', border: 'none',
  width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const navBtnStyle = {
  background: '#334155', color: '#fff', border: 'none',
  padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
};

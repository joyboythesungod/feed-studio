import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { 
  Check, X, ArrowRight, Circle, Star, Heart, AlertTriangle, 
  Download, Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon,
  Type, List, MessageSquareQuote, Sparkles, User, Palette,
  Bold, Italic, FileText, Layers, Copy, Upload, Wand2, Edit3,
  Settings, Menu, ChevronLeft, Smartphone, Monitor,
  ZoomIn, ZoomOut, Crop, Move, RotateCcw, BookOpen, AlertCircle,
  GripVertical
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
  // Warm
  { name: 'Pink Muda', color: '#FECDD3' },
  { name: 'Pink', color: '#FBA5C2' },
  { name: 'Coral', color: '#FCA5A5' },
  { name: 'Peach', color: '#FED7AA' },
  { name: 'Kuning Muda', color: '#FEF3C7' },
  { name: 'Kuning', color: '#FDE68A' },
  // Nature
  { name: 'Lime', color: '#D9F99D' },
  { name: 'Hijau Muda', color: '#D1FAE5' },
  { name: 'Hijau', color: '#A7F3D0' },
  { name: 'Mint', color: '#A7F3D0' },
  // Cool
  { name: 'Cyan', color: '#CFFAFE' },
  { name: 'Biru Muda', color: '#DBEAFE' },
  { name: 'Biru', color: '#BFDBFE' },
  { name: 'Ungu Muda', color: '#E9D5FF' },
  { name: 'Ungu', color: '#D8B4FE' },
  // Neutral
  { name: 'Abu', color: '#E5E7EB' },
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

const fontLink = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&family=Scheherazade+New:wght@400;500;600;700&display=swap');`;

const uid = () => Math.random().toString(36).slice(2, 10);

// ============ ARABIC TEXT DETECTION ============
// Range Unicode Arabic + harokat:
// U+0600–U+06FF (Arabic), U+0750–U+077F, U+08A0–U+08FF, U+FB50–U+FDFF, U+FE70–U+FEFF
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ARABIC_RUN_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF][\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\.\،\؛\؟\!\:\-\d]*/g;

function hasArabic(text) {
  if (!text) return false;
  // Strip HTML untuk cek mentah
  const stripped = String(text).replace(/<[^>]+>/g, '');
  return ARABIC_REGEX.test(stripped);
}

// Wrap setiap run Arab dengan <span> Scheherazade + RTL
// Bekerja pada HTML — hati-hati supaya gak rusak existing tags
function wrapArabicSpans(html, sizeMultiplier = 1.5) {
  if (!html) return html;
  if (!ARABIC_REGEX.test(html)) return html;
  
  // Strategy: pisahkan HTML menjadi text nodes dan tag nodes, lalu transform text nodes saja
  const parts = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      // Skip tag
      const end = html.indexOf('>', i);
      if (end === -1) { parts.push(html.slice(i)); break; }
      parts.push(html.slice(i, end + 1));
      i = end + 1;
    } else {
      // Text run
      const next = html.indexOf('<', i);
      const textEnd = next === -1 ? html.length : next;
      const textChunk = html.slice(i, textEnd);
      // Wrap Arabic runs di dalam text chunk
      const wrapped = textChunk.replace(ARABIC_RUN_REGEX, (match) => {
        if (!ARABIC_REGEX.test(match)) return match;
        return `<span style="font-family: 'Scheherazade New', serif; direction: rtl; unicode-bidi: embed; font-size: ${sizeMultiplier}em; line-height: 1.8; display: inline-block; vertical-align: middle;">${match}</span>`;
      });
      parts.push(wrapped);
      i = textEnd;
    }
  }
  return parts.join('');
}

// Default global settings
const DEFAULT_SETTINGS = {
  paddingX: 96,           // jarak konten ke pinggir kiri/kanan canvas
  edgeTop: 80,            // jarak username ke pinggir atas canvas (fixed margin)
  edgeBottom: 80,         // jarak footer/area bawah ke pinggir bawah canvas (fixed margin)
  gapAfterHeader: 64,     // JARAK USERNAME → KONTEN (= jarak konten → footer, simetris)
  lineHeight: 1.3,
  blockGap: 28,
};

// Default ukuran konten
const DEFAULT_CONTENT_SIZE = 40;
const MIN_CONTENT_SIZE = 24;

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
    text: 'Secara ilmiah, terapi gurah lendir <mark style="background:#FECDD3; padding:1px 5px; border-radius:4px; box-decoration-break:clone; -webkit-box-decoration-break:clone">TIDAK direkomendasikan</mark> sebagai terapi standar medis.',
    font: 'Montserrat',
    color: '#111827',
    size: 40,
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
    size: 40,
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
    size: 40,
    weight: 400,
  },
];

// ============ KOMPONEN: Image Cropper Modal ============
// Drag untuk pan + slider untuk zoom (Instagram-style)
function ImageCropper({ imageSrc, aspectRatio, shape, onSave, onCancel, initialCrop }) {
  const [scale, setScale] = useState(initialCrop?.scale || 1);
  const [offsetX, setOffsetX] = useState(initialCrop?.offsetX || 0);
  const [offsetY, setOffsetY] = useState(initialCrop?.offsetY || 0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offX: 0, offY: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  
  // Container size — kotak preview (responsive)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const containerW = isMobile ? 280 : 420;
  const containerH = containerW / aspectRatio;
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageSrc;
  }, [imageSrc]);
  
  // Calculate base scale to "cover" the container at scale=1
  const baseScale = imgDims.w && imgDims.h
    ? Math.max(containerW / imgDims.w, containerH / imgDims.h)
    : 1;
  
  const displayW = imgDims.w * baseScale * scale;
  const displayH = imgDims.h * baseScale * scale;
  
  // Clamp offsets so image always covers container
  const clampOffsets = (x, y) => {
    const maxX = Math.max(0, (displayW - containerW) / 2);
    const maxY = Math.max(0, (displayH - containerH) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };
  
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const pt = e.touches ? e.touches[0] : e;
    dragStartRef.current = { x: pt.clientX, y: pt.clientY, offX: offsetX, offY: offsetY };
  };
  
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - dragStartRef.current.x;
    const dy = pt.clientY - dragStartRef.current.y;
    const { x, y } = clampOffsets(dragStartRef.current.offX + dx, dragStartRef.current.offY + dy);
    setOffsetX(x);
    setOffsetY(y);
  };
  
  const handlePointerUp = () => setIsDragging(false);
  
  useEffect(() => {
    if (!isDragging) return;
    const moveHandler = (e) => handlePointerMove(e);
    const upHandler = () => handlePointerUp();
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler, { passive: false });
    window.addEventListener('touchend', upHandler);
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', upHandler);
    };
  }, [isDragging, offsetX, offsetY]);
  
  // When scale changes, re-clamp offsets
  useEffect(() => {
    const { x, y } = clampOffsets(offsetX, offsetY);
    if (x !== offsetX) setOffsetX(x);
    if (y !== offsetY) setOffsetY(y);
  }, [scale, imgDims]);
  
  const handleSave = () => {
    // Crop the image based on current view
    if (!imgDims.w) return onCancel();
    
    // Output canvas size — keep good quality
    const outputW = shape === 'circle' ? 400 : Math.max(800, containerW * 2);
    const outputH = outputW / aspectRatio;
    
    const canvas = document.createElement('canvas');
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');
    
    // Background white for transparent images
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputW, outputH);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Map preview coordinates to output coordinates
      const scaleRatio = outputW / containerW;
      const drawW = displayW * scaleRatio;
      const drawH = displayH * scaleRatio;
      const drawX = (outputW - drawW) / 2 + offsetX * scaleRatio;
      const drawY = (outputH - drawH) / 2 + offsetY * scaleRatio;
      
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      
      const dataUrl = canvas.toDataURL('image/png', 0.92);
      onSave({
        src: dataUrl,
        crop: { scale, offsetX, offsetY, original: imageSrc }
      });
    };
    img.src = imageSrc;
  };
  
  const reset = () => { setScale(1); setOffsetX(0); setOffsetY(0); };
  
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
    }}>
      <div style={{
        background: '#1E293B', padding: 20, borderRadius: 16, maxWidth: '100%',
        border: '1px solid #475569',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Crop size={20} color="#60A5FA" />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#F1F5F9' }}>Atur Crop Gambar</div>
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Move size={12} /> Geser untuk pindah · scroll untuk zoom
        </div>
        
        {/* Preview area */}
        <div
          ref={containerRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onWheel={(e) => { e.preventDefault(); setScale(s => Math.max(1, Math.min(4, s + (e.deltaY < 0 ? 0.1 : -0.1)))); }}
          style={{
            width: containerW, height: containerH,
            overflow: 'hidden', position: 'relative',
            background: '#0F172A', borderRadius: shape === 'circle' ? '50%' : (shape === 'rounded' ? 14 : 4),
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none', touchAction: 'none',
            margin: '0 auto',
          }}
        >
          {imgDims.w > 0 && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                width: displayW, height: displayH,
                left: `calc(50% - ${displayW / 2}px + ${offsetX}px)`,
                top: `calc(50% - ${displayH / 2}px + ${offsetY}px)`,
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        
        {/* Zoom slider */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ZoomOut size={16} color="#94A3B8" />
          <input
            type="range"
            min={1} max={4} step={0.05}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#3B82F6' }}
          />
          <ZoomIn size={16} color="#94A3B8" />
          <button onClick={reset} style={{
            background: '#334155', color: '#E2E8F0', border: 'none',
            width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onCancel} style={{
            padding: '9px 16px', background: '#334155', color: '#E2E8F0',
            border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Batal</button>
          <button onClick={handleSave} style={{
            padding: '9px 18px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}><Check size={14} /> Simpan</button>
        </div>
      </div>
    </div>
  );
}

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
    return <div style={{ ...commonStyle, marginBottom: settings.blockGap }} dangerouslySetInnerHTML={{ __html: wrapArabicSpans(block.text, 1.4) }} />;
  }
  if (block.type === 'paragraph') {
    return <div style={{ ...commonStyle, marginBottom: settings.blockGap }} dangerouslySetInnerHTML={{ __html: wrapArabicSpans(block.text, 1.6) }} />;
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
            <div style={commonStyle} dangerouslySetInnerHTML={{ __html: wrapArabicSpans(item, 1.5) }} />
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
        <div style={commonStyle} dangerouslySetInnerHTML={{ __html: wrapArabicSpans(block.text, 1.5) }} />
      </div>
    );
  }
  if (block.type === 'image') {
    const radius = block.shape === 'rounded' ? 20 : block.shape === 'circle' ? 9999 : 0;
    
    // Map align ke justifyContent flex
    const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
    const justify = justifyMap[block.align] || 'center';
    
    // Stroke (border) — opsional
    const strokeStyle = block.strokeEnabled
      ? `${block.strokeWidth || 4}px solid ${block.strokeColor || '#111827'}`
      : 'none';
    
    // Shadow — opsional, soft drop shadow
    const shadowStyle = block.shadowEnabled
      ? `0 ${(block.shadowSize || 8)}px ${(block.shadowSize || 8) * 3}px rgba(0,0,0,${block.shadowOpacity || 0.15})`
      : 'none';
    
    return (
      <div style={{ marginBottom: settings.blockGap, display: 'flex', justifyContent: justify }}>
        <img src={block.src} alt="" style={{
          maxWidth: '100%', width: block.width || '70%',
          aspectRatio: block.aspectRatio || 'auto', objectFit: 'cover',
          borderRadius: radius,
          border: strokeStyle,
          boxShadow: shadowStyle,
          display: 'block',
        }} />
      </div>
    );
  }
  return null;
}

// ============ KOMPONEN: Reference Slide Body ============
// Layout khusus untuk slide terakhir di carousel berisi referensi
function ReferenceSlideBody({ slide, settings }) {
  const title = slide.refTitle || 'Referensi';
  const items = slide.refItems || [];
  
  return (
    <div>
      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
        <div style={{
          fontSize: 72, fontWeight: 800, color: '#1E40AF',
          fontFamily: "'Montserrat', sans-serif", lineHeight: 1,
        }}>
          {title}
        </div>
      </div>
      
      {/* Numbered list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#1E40AF', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 22, flexShrink: 0,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {i + 1}
            </div>
            <div style={{
              fontSize: 28, color: '#111827', lineHeight: 1.4,
              fontFamily: "'Montserrat', sans-serif", paddingTop: 6,
            }} dangerouslySetInnerHTML={{ __html: item }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ KOMPONEN: Slide Canvas ============
const SlideCanvas = React.forwardRef(({ slide, profile, footer, settings, pageIndex, totalPages }, ref) => {
  const hasFooter = footer && footer.trim() && totalPages === 1 && !slide.isReferenceSlide;
  
  // ===== HITUNG TINGGI HEADER & FOOTER =====
  // Header tinggi tetap: edgeTop + tinggi avatar (64px)
  const headerH = settings.edgeTop + 64;
  // Footer tinggi: edgeBottom + tinggi teks footer estimasi (jika ada)
  const footerH = hasFooter
    ? settings.edgeBottom + Math.max(60, String(footer).split('\n').length * 28)
    : settings.edgeBottom;
  
  // Area tengah untuk konten — tinggi tersedia setelah header dan footer
  // gapAfterHeader = jarak konten ke header DAN ke footer (simetris)
  const contentAreaTop = headerH + settings.gapAfterHeader;
  const contentAreaBottom = footerH + settings.gapAfterHeader;
  
  return (
    <div
      ref={ref}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {/* Header identity — fixed di atas */}
      <div style={{ 
        position: 'absolute', top: settings.edgeTop, left: settings.paddingX, right: settings.paddingX,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 9999, overflow: 'hidden',
          background: '#E5E7EB', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {profile.avatar && (
            <img
              src={profile.avatar}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block',
              }}
            />
          )}
        </div>
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

      {/* Body — center vertically dalam area tengah, dengan gap simetris ke header dan footer */}
      <div style={{ 
        position: 'absolute',
        top: contentAreaTop,
        bottom: contentAreaBottom,
        left: settings.paddingX,
        right: settings.paddingX,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {slide.isReferenceSlide ? (
          <div data-slide-body>
            <ReferenceSlideBody slide={slide} settings={settings} />
          </div>
        ) : (
          <div data-slide-body>
            {slide.blocks.map(block => (
              <RenderBlock key={block.id} block={block} settings={settings} />
            ))}
          </div>
        )}
      </div>

      {/* Footer — fixed di bawah */}
      {hasFooter && (
        <div style={{
          position: 'absolute',
          left: settings.paddingX,
          right: settings.paddingX,
          bottom: settings.edgeBottom,
          fontSize: 18, color: '#6B7280', fontStyle: 'italic',
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
  const [footer, setFooter] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [slides, setSlides] = useState([
    { id: uid(), bg: '#FFFFFF', blocks: defaultBlocks() },
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [draggingBlockIdx, setDraggingBlockIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiAllowSplit, setAiAllowSplit] = useState(false); // default: 1 slide saja
  const [aiImproveText, setAiImproveText] = useState(true); // default: perbaiki teks
  const [aiError, setAiError] = useState('');
  const [overflowPopup, setOverflowPopup] = useState(null);
  const [convertingBlock, setConvertingBlock] = useState(null); // blockId yang lagi dalam proses convert
  const [convertTargetType, setConvertTargetType] = useState('paragraph'); // dropdown value
  // { onShrink: () => void, onSplit: () => void }

  const canvasRefs = useRef({});
  
  // ===== UNDO/REDO HISTORY =====
  // Simpan snapshot dari state (slides, footer, profile, settings) di history stack
  // Saat user lakukan action → push ke past, clear future
  // Saat undo → pop past, push ke future
  // Saat redo → pop future, push ke past
  const historyRef = useRef({
    past: [],     // array of snapshots, oldest first
    future: [],   // array of snapshots, newest first
    isApplying: false, // true saat sedang apply undo/redo (jangan re-record)
  });
  const HISTORY_LIMIT = 50;
  const [historyTick, setHistoryTick] = useState(0); // untuk re-render button enabled state
  
  // Capture snapshot dari state yang relevan
  const captureSnapshot = () => ({
    slides: JSON.parse(JSON.stringify(slides)),
    footer,
    profile: JSON.parse(JSON.stringify(profile)),
    settings: { ...settings },
    activeSlide,
  });
  
  // Apply snapshot ke state
  const applySnapshot = (snap) => {
    historyRef.current.isApplying = true;
    setSlides(snap.slides);
    setFooter(snap.footer);
    setProfile(snap.profile);
    setSettings(snap.settings);
    setActiveSlide(Math.min(snap.activeSlide, snap.slides.length - 1));
    // Reset flag setelah React render selesai
    setTimeout(() => { historyRef.current.isApplying = false; }, 0);
  };
  
  // Record current state ke history. Dipanggil secara debounced via useEffect.
  const lastSnapshotRef = useRef(null);
  useEffect(() => {
    if (historyRef.current.isApplying) return;
    
    const timer = setTimeout(() => {
      const snap = captureSnapshot();
      const snapJson = JSON.stringify(snap);
      
      // Skip kalau sama dengan snapshot terakhir (gak ada perubahan riil)
      if (lastSnapshotRef.current === snapJson) return;
      lastSnapshotRef.current = snapJson;
      
      const h = historyRef.current;
      h.past.push(snap);
      if (h.past.length > HISTORY_LIMIT) h.past.shift();
      h.future = []; // action baru → clear future
      setHistoryTick(t => t + 1);
    }, 350); // debounce 350ms agar slider drag dll tidak spam history
    
    return () => clearTimeout(timer);
  }, [slides, footer, profile, settings]);
  
  const undo = () => {
    const h = historyRef.current;
    // Past terakhir = current state, jadi pop yang current dulu lalu apply yang sebelumnya
    if (h.past.length < 2) return;
    const current = h.past.pop();
    h.future.unshift(current);
    const target = h.past[h.past.length - 1];
    lastSnapshotRef.current = JSON.stringify(target);
    applySnapshot(target);
    setHistoryTick(t => t + 1);
  };
  
  const redo = () => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const target = h.future.shift();
    h.past.push(target);
    lastSnapshotRef.current = JSON.stringify(target);
    applySnapshot(target);
    setHistoryTick(t => t + 1);
  };
  
  const canUndo = historyRef.current.past.length >= 2;
  const canRedo = historyRef.current.future.length > 0;
  
  // Keyboard shortcut: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e) => {
      // Ignore kalau lagi ngetik di input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;
      
      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));
      
      if (isUndo) { e.preventDefault(); undo(); }
      else if (isRedo) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
  
  // Sync convertTargetType ke jenis valid (yang beda dari selectedBlock.type)
  useEffect(() => {
    if (selectedBlock && selectedBlock.type === convertTargetType) {
      const alternatives = ['paragraph', 'bullets', 'callout', 'heading'].filter(t => t !== selectedBlock.type);
      setConvertTargetType(alternatives[0]);
    }
  }, [selectedBlock?.type]);
  
  // ===== Overflow detection + Auto-shrink =====
  // Strategi: 
  // 1. Kalau konten > canvas, auto-shrink secara silent (font menyesuaikan)
  // 2. Kalau sudah di MIN_CONTENT_SIZE tapi masih overflow → munculkan popup pilihan
  
  const lastShrinkRef = useRef({ slideId: null, attempted: false });
  
  useEffect(() => {
    if (!currentSlide || currentSlide.isReferenceSlide) return;
    if (overflowPopup) return;
    
    const timer = setTimeout(() => {
      const node = canvasRefs.current[activeSlide];
      if (!node) return;
      
      const bodyDiv = node.querySelector('[data-slide-body]');
      if (!bodyDiv) return;
      
      // Tinggi konten asli
      const bodyContentH = bodyDiv.scrollHeight;
      // Tinggi area yang tersedia (parent dari bodyDiv)
      const parentDiv = bodyDiv.parentElement;
      if (!parentDiv) return;
      const availableH = parentDiv.clientHeight;
      
      if (bodyContentH > availableH + 4) {
        // Konten overflow!
        const minSize = Math.min(...currentSlide.blocks
          .filter(b => b.type !== 'image' && b.size)
          .map(b => b.size));
        
        if (minSize > MIN_CONTENT_SIZE) {
          // Masih bisa shrink — auto shrink
          const ratio = Math.max(0.9, availableH / bodyContentH); // shrink bertahap
          autoShrink(ratio);
        } else if (!lastShrinkRef.current.attempted || lastShrinkRef.current.slideId !== currentSlide.id) {
          // Sudah di minimum tapi masih overflow → popup
          lastShrinkRef.current = { slideId: currentSlide.id, attempted: true };
          setOverflowPopup({
            onShrink: () => autoShrink(availableH / bodyContentH, true),
            onSplit: () => splitCurrentSlide(),
          });
        }
      } else {
        // Tidak overflow lagi
        lastShrinkRef.current = { slideId: currentSlide.id, attempted: false };
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentSlide, settings, footer, slides.length, activeSlide]);
  
  const autoShrink = (ratio, force = false) => {
    if (!currentSlide || currentSlide.isReferenceSlide) return;
    const minSize = force ? 16 : MIN_CONTENT_SIZE;
    setSlides(slides.map((s, i) => {
      if (i !== activeSlide) return s;
      return {
        ...s,
        blocks: s.blocks.map(b => {
          if (b.type === 'image' || !b.size) return b;
          const newSize = Math.max(minSize, Math.floor(b.size * ratio));
          return { ...b, size: newSize };
        }),
      };
    }));
  };
  
  const splitCurrentSlide = () => {
    if (!currentSlide || currentSlide.isReferenceSlide) return;
    const blocks = currentSlide.blocks;
    if (blocks.length < 2) return;
    
    const mid = Math.ceil(blocks.length / 2);
    const firstHalf = blocks.slice(0, mid);
    const secondHalf = blocks.slice(mid);
    
    // Reset font size pada slide baru ke default
    const resetBlocks = (bs) => bs.map(b => {
      if (b.type === 'image' || !b.size) return b;
      // Heading tetap besar
      if (b.type === 'heading') return { ...b, size: 60 };
      return { ...b, size: DEFAULT_CONTENT_SIZE };
    });
    
    const newSlide = { id: uid(), bg: currentSlide.bg, blocks: resetBlocks(secondHalf) };
    const newSlides = [...slides];
    newSlides[activeSlide] = { ...currentSlide, blocks: resetBlocks(firstHalf) };
    newSlides.splice(activeSlide + 1, 0, newSlide);
    setSlides(newSlides);
  };

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
    else if (type === 'paragraph') newBlock = { id: uid(), type: 'paragraph', text: 'Paragraf...', size: DEFAULT_CONTENT_SIZE, weight: 400, align: 'left', ...base };
    else if (type === 'bullets') newBlock = { id: uid(), type: 'bullets', items: ['Poin 1', 'Poin 2'], icon: 'arrow-right', iconColor: '#16A34A', size: DEFAULT_CONTENT_SIZE, weight: 400, ...base };
    else if (type === 'callout') newBlock = { id: uid(), type: 'callout', text: 'Catatan penting', bgColor: '#DBEAFE', borderColor: '#3B82F6', size: DEFAULT_CONTENT_SIZE, weight: 400, ...base };
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
  
  // Reorder via drag-drop: pindah block dari `fromIdx` ke `toIdx`
  const reorderBlocks = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setSlides(slides.map((s, i) => {
      if (i !== activeSlide) return s;
      const newBlocks = [...s.blocks];
      const [moved] = newBlocks.splice(fromIdx, 1);
      newBlocks.splice(toIdx, 0, moved);
      return { ...s, blocks: newBlocks };
    }));
  };

  // ===== Format =====
  // Stabilo manual: wrap selection dalam <mark> dengan rounded styling
  const applyHighlight = (color) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    
    if (color === 'transparent' || !color) {
      // Hapus highlight: jika selection ada di dalam mark, unwrap
      const selectedText = range.toString();
      if (!selectedText) return;
      // Cari mark ancestor
      let node = range.commonAncestorContainer;
      while (node && node.nodeType === 3) node = node.parentNode;
      while (node && node.nodeName !== 'MARK' && node.nodeName !== 'DIV') node = node.parentNode;
      if (node && node.nodeName === 'MARK') {
        // Replace mark dengan text content
        const parent = node.parentNode;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
      }
      return;
    }
    
    const selectedHTML = range.cloneContents();
    const div = document.createElement('div');
    div.appendChild(selectedHTML);
    const innerHTML = div.innerHTML;
    
    // Bersihkan mark nested kalau ada (supaya gak double-wrap)
    const cleanHTML = innerHTML.replace(/<\/?mark[^>]*>/g, '');
    
    const markHTML = `<mark style="background:${color}; padding:1px 5px; border-radius:4px; box-decoration-break:clone; -webkit-box-decoration-break:clone">${cleanHTML}</mark>`;
    document.execCommand('insertHTML', false, markHTML);
  };
  const applyBold = () => document.execCommand('bold');
  const applyItalic = () => document.execCommand('italic');
  const clearFormatting = () => document.execCommand('removeFormat');

  // ===== Uploads =====
  // Cropper state — buka cropper sebelum simpan ke profile/block
  const [cropperState, setCropperState] = useState(null);
  // { rawSrc, aspectRatio, shape, onSave: (data) => void }
  
  const openAvatarCropper = (rawSrc) => {
    setCropperState({
      rawSrc,
      aspectRatio: 1,
      shape: 'circle',
      onSave: (data) => {
        setProfile(p => ({ ...p, avatar: data.src, avatarCrop: data.crop }));
        setCropperState(null);
      },
    });
  };
  
  const openBlockImageCropper = (rawSrc, blockId, shape, aspectRatio = 16/9) => {
    setCropperState({
      rawSrc,
      aspectRatio,
      shape: shape || 'rounded',
      onSave: (data) => {
        updateBlock(blockId, { src: data.src, crop: data.crop, originalSrc: data.crop.original });
        setCropperState(null);
      },
    });
  };
  
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => openAvatarCropper(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = ''; // allow re-upload same file
  };
  const handleImageUpload = (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    const block = currentSlide.blocks.find(b => b.id === blockId);
    const reader = new FileReader();
    reader.onload = (ev) => openBlockImageCropper(ev.target.result, blockId, block?.shape || 'rounded', 16/9);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  // Re-crop existing image
  const reCropAvatar = () => {
    const src = profile.avatarCrop?.original || profile.avatar;
    if (!src) return;
    setCropperState({
      rawSrc: src,
      aspectRatio: 1,
      shape: 'circle',
      initialCrop: profile.avatarCrop,
      onSave: (data) => {
        setProfile(p => ({ ...p, avatar: data.src, avatarCrop: data.crop }));
        setCropperState(null);
      },
    });
  };
  
  const reCropBlockImage = (blockId) => {
    const block = currentSlide.blocks.find(b => b.id === blockId);
    if (!block || !block.src) return;
    const src = block.originalSrc || block.crop?.original || block.src;
    setCropperState({
      rawSrc: src,
      aspectRatio: 16/9,
      shape: block.shape || 'rounded',
      initialCrop: block.crop,
      onSave: (data) => {
        updateBlock(blockId, { src: data.src, crop: data.crop });
        setCropperState(null);
      },
    });
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
        body: JSON.stringify({ text: aiInputText, allowSplit: aiAllowSplit, improveText: aiImproveText }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      const parsed = await resp.json();

      // Convert parsed slides to app slides
      const newSlides = parsed.slides.map(s => {
        // Special handling for reference slide
        if (s.isReferenceSlide) {
          return {
            id: uid(),
            bg: '#FFFFFF',
            isReferenceSlide: true,
            refTitle: s.title || 'Referensi',
            refItems: s.items || [],
            blocks: [],
          };
        }
        
        return {
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
                  text = text.replace(re, `<mark style="background:${h.color}; padding:1px 5px; border-radius:4px; box-decoration-break:clone; -webkit-box-decoration-break:clone">${h.phrase}</mark>`);
                });
              }
              return { id: uid(), type: 'paragraph', text, font: 'Montserrat', color: '#111827', size: DEFAULT_CONTENT_SIZE, weight: 400, align: 'left' };
            }
            if (b.type === 'bullets') {
              const iconConf = BULLET_ICONS[b.icon] || BULLET_ICONS['arrow-right'];
              return { id: uid(), type: 'bullets', items: b.items, icon: b.icon || 'arrow-right', iconColor: iconConf.color, font: 'Montserrat', color: '#111827', size: DEFAULT_CONTENT_SIZE, weight: 400 };
            }
            if (b.type === 'callout') {
              return { id: uid(), type: 'callout', text: b.text, bgColor: b.bgColor || '#DBEAFE', borderColor: '#3B82F6', font: 'Montserrat', color: '#111827', size: DEFAULT_CONTENT_SIZE, weight: 400 };
            }
            return null;
          }).filter(Boolean),
        };
      });

      setSlides(newSlides);
      setActiveSlide(0);
      // Footer: ikuti hasil AI. Kalau null/kosong, hapus footer (jangan keep yang lama)
      setFooter(parsed.footer || '');
      setShowAIModal(false);
      setAiInputText('');
      setAiError('');
    } catch (err) {
      console.error('AI Process Error:', err);
      setAiError(err.message || 'Error tidak diketahui');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ===== EXPORT PNG =====
  // ===== Convert block type via AI =====
  const handleConvertBlock = async (blockId, targetType) => {
    const block = currentSlide?.blocks.find(b => b.id === blockId);
    if (!block) return;
    if (block.type === targetType) {
      setAiError('Block sudah berjenis ' + targetType);
      return;
    }
    
    setConvertingBlock(blockId);
    setAiError('');
    
    try {
      const resp = await fetch('/api/convert-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block, targetType }),
      });
      
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      
      const newBlock = await resp.json();
      
      // Convert ke format internal app
      let appBlock;
      const base = { id: block.id, font: block.font || 'Montserrat' };
      
      if (newBlock.type === 'heading') {
        appBlock = { ...base, type: 'heading', text: newBlock.text, color: '#7F1D1D', size: 60, weight: 800, align: 'left' };
      } else if (newBlock.type === 'paragraph') {
        let text = newBlock.text || '';
        if (newBlock.highlights && Array.isArray(newBlock.highlights)) {
          newBlock.highlights.forEach(h => {
            const re = new RegExp(h.phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            text = text.replace(re, `<mark style="background:${h.color}; padding:1px 5px; border-radius:4px; box-decoration-break:clone; -webkit-box-decoration-break:clone">${h.phrase}</mark>`);
          });
        }
        appBlock = { ...base, type: 'paragraph', text, color: '#111827', size: DEFAULT_CONTENT_SIZE, weight: 400, align: 'left' };
      } else if (newBlock.type === 'bullets') {
        const iconConf = BULLET_ICONS[newBlock.icon] || BULLET_ICONS['arrow-right'];
        appBlock = { ...base, type: 'bullets', items: newBlock.items || [], icon: newBlock.icon || 'arrow-right', iconColor: iconConf.color, color: '#111827', size: DEFAULT_CONTENT_SIZE, weight: 400 };
      } else if (newBlock.type === 'callout') {
        appBlock = { ...base, type: 'callout', text: newBlock.text, bgColor: newBlock.bgColor || '#DBEAFE', borderColor: '#3B82F6', color: '#111827', size: DEFAULT_CONTENT_SIZE, weight: 400 };
      } else {
        throw new Error('Tipe block tidak dikenali: ' + newBlock.type);
      }
      
      // Replace block in slides
      setSlides(slides.map((s, i) => {
        if (i !== activeSlide) return s;
        return {
          ...s,
          blocks: s.blocks.map(b => b.id === blockId ? appBlock : b),
        };
      }));
    } catch (err) {
      console.error('Convert block error:', err);
      setAiError('Gagal ubah block: ' + err.message);
    } finally {
      setConvertingBlock(null);
    }
  };
  
  const exportSlide = async (slideIdx) => {
    try {
      const node = canvasRefs.current[slideIdx];
      if (!node) {
        alert('Slide tidak ditemukan. Coba klik slide-nya dulu di preview.');
        return;
      }

      // Tunggu semua image dalam node fully loaded
      const imgs = node.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(res => {
          img.onload = res;
          img.onerror = res; // tetap lanjut meski ada yang gagal
          // Force re-load kalau perlu
          if (img.complete) res();
        });
      }));
      
      // Beri waktu ekstra untuk font dan rendering
      await new Promise(r => setTimeout(r, 200));

      const opts = {
        width: CANVAS_W,
        height: CANVAS_H,
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: '#FFFFFF',
        skipFonts: false,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
        },
      };

      // Jalankan toPng 2x — kadang yang pertama gagal load image/font, yang kedua lancar
      // (technique umum di komunitas html-to-image untuk hasil reliable)
      await toPng(node, opts);
      const dataUrl = await toPng(node, opts);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${profile.name}-slide-${slideIdx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal export: ' + err.message);
    }
  };

  const exportAll = async () => {
    const startSlide = activeSlide;
    for (let i = 0; i < slides.length; i++) {
      setActiveSlide(i);
      // Tunggu canvas re-render
      await new Promise(r => setTimeout(r, 400));
      await exportSlide(i);
      await new Promise(r => setTimeout(r, 300));
    }
    setActiveSlide(startSlide);
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
        mark { padding: 1px 5px; border-radius: 4px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
        button { font-family: 'Montserrat', sans-serif; }
        input, select, textarea { font-family: 'Montserrat', sans-serif; }
      `}</style>

      {/* ===== TOP BAR ===== */}
      <div style={{
        background: '#1E293B',
        padding: isMobile 
          ? 'max(10px, env(safe-area-inset-top, 0px)) 10px 10px 10px' 
          : '14px 20px',
        borderBottom: '1px solid #334155',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: isMobile ? 6 : 8,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
          {isMobile && (
            <button
              onClick={() => setMobilePanel(mobilePanel === 'left' ? 'canvas' : 'left')}
              style={mobileTabBtn(mobilePanel === 'left')}
            >
              <Menu size={18} />
            </button>
          )}
          <div style={{
            width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Layers size={isMobile ? 16 : 18} color="#fff" />
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Feed Studio</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>by Joyboy</div>
            </div>
          )}
        </div>

        {/* Mode switcher - icon only di mobile */}
        <div style={{ 
          display: 'flex', background: '#0F172A', 
          padding: isMobile ? 2 : 3, borderRadius: 8, gap: 2, flexShrink: 0,
        }}>
          <button
            onClick={() => setMode('ai')}
            style={{
              background: mode === 'ai' ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'transparent',
              color: '#fff', border: 'none', 
              padding: isMobile ? '6px 8px' : '6px 12px', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            title="AI Auto"
          >
            <Wand2 size={13} /> {!isMobile && 'AI Auto'}
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{
              background: mode === 'manual' ? '#3B82F6' : 'transparent',
              color: '#fff', border: 'none', 
              padding: isMobile ? '6px 8px' : '6px 12px', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            title="Manual"
          >
            <Edit3 size={13} /> {!isMobile && 'Manual'}
          </button>
        </div>

        <div style={{ 
          display: 'flex', gap: isMobile ? 4 : 6, alignItems: 'center', flexShrink: 0,
        }}>
          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              background: '#334155', color: '#fff', border: 'none',
              padding: isMobile ? '6px 7px' : '7px 9px', borderRadius: 6,
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.35,
              display: 'flex', alignItems: 'center',
            }}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={isMobile ? 13 : 14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              background: '#334155', color: '#fff', border: 'none',
              padding: isMobile ? '6px 7px' : '7px 9px', borderRadius: 6,
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.35,
              display: 'flex', alignItems: 'center',
              transform: 'scaleX(-1)',
            }}
            title="Redo (Ctrl+Shift+Z atau Ctrl+Y)"
          >
            <RotateCcw size={isMobile ? 13 : 14} />
          </button>
          
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
        height: isMobile 
          ? 'calc(100dvh - 60px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))' 
          : 'calc(100vh - 60px)',
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
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
            {profile.avatar && (
              <button
                onClick={reCropAvatar}
                style={{
                  ...inputStyle, background: '#334155', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  marginBottom: 14,
                }}
              >
                <Crop size={12} /> Atur Crop Foto Profil
              </button>
            )}

            {/* GLOBAL SETTINGS */}
            <SectionTitle icon={Settings} text="Layout (Semua Slide)" />
            <SliderField
              label="Margin Pinggir Kiri/Kanan"
              value={settings.paddingX}
              min={48} max={160} step={8}
              onChange={v => setSettings({ ...settings, paddingX: v })}
              unit="px"
            />
            <SliderField
              label="Margin Atas Canvas"
              value={settings.edgeTop}
              min={40} max={400} step={4}
              onChange={v => setSettings({ ...settings, edgeTop: v })}
              unit="px"
              hint="jarak username ke pinggir atas"
            />
            <SliderField
              label="Margin Bawah Canvas"
              value={settings.edgeBottom}
              min={40} max={400} step={4}
              onChange={v => setSettings({ ...settings, edgeBottom: v })}
              unit="px"
              hint="jarak footer ke pinggir bawah"
            />
            <SliderField
              label="Jarak Username ↔ Konten"
              value={settings.gapAfterHeader}
              min={24} max={200} step={4}
              onChange={v => setSettings({ ...settings, gapAfterHeader: v })}
              unit="px"
              hint="= jarak konten ke footer (simetris)"
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
              {/* Block insert toolbar — available in BOTH modes */}
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
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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
              
              {/* Tombol Tambah Slide — selalu tersedia di bawah preview */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={addSlide}
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8,
                    fontWeight: 600, cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Plus size={14} /> Tambah Slide
                </button>
                {slides.length > 1 && (
                  <button
                    onClick={() => duplicateSlide(activeSlide)}
                    style={{ ...navBtnStyle, background: '#475569' }}
                    title="Duplicate slide ini"
                  >
                    <Copy size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Duplicate
                  </button>
                )}
              </div>
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
                Belum ada block. Tambahkan dari toolbar di atas canvas, atau pakai "Generate Otomatis" untuk AI auto-layout.
              </div>
            )}
            {currentSlide.blocks.map((block, blockIdx) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => {
                  setDraggingBlockIdx(blockIdx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggingBlockIdx(null);
                  setDragOverIdx(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (draggingBlockIdx !== null && draggingBlockIdx !== blockIdx) {
                    setDragOverIdx(blockIdx);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIdx === blockIdx) setDragOverIdx(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingBlockIdx !== null && draggingBlockIdx !== blockIdx) {
                    reorderBlocks(draggingBlockIdx, blockIdx);
                  }
                  setDraggingBlockIdx(null);
                  setDragOverIdx(null);
                }}
                onClick={() => setSelectedBlockId(selectedBlockId === block.id ? null : block.id)}
                style={{
                  padding: 9, marginBottom: 6, borderRadius: 7,
                  background: selectedBlockId === block.id ? '#1E40AF' : '#0F172A',
                  cursor: 'pointer', fontSize: 12,
                  border: selectedBlockId === block.id 
                    ? '1px solid #3B82F6' 
                    : dragOverIdx === blockIdx
                    ? '2px dashed #60A5FA'
                    : '1px solid transparent',
                  opacity: draggingBlockIdx === blockIdx ? 0.4 : 1,
                  transform: dragOverIdx === blockIdx ? 'translateY(2px)' : 'none',
                  transition: 'transform 0.15s, opacity 0.15s, border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'grab', color: '#64748B',
                        display: 'flex', alignItems: 'center', flexShrink: 0,
                      }}
                      title="Drag untuk pindah urutan"
                    >
                      <GripVertical size={12} />
                    </span>
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, color: '#94A3B8' }}>
                      {block.type}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748B', marginLeft: 'auto', marginRight: 6 }}>
                      {selectedBlockId === block.id ? '▼' : '▶'}
                    </span>
                  </div>
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
                
                {/* === UBAH JENIS BLOCK VIA AI === */}
                {selectedBlock.type !== 'image' && (
                  <div style={{
                    marginBottom: 12, padding: 10, background: '#1E293B',
                    borderRadius: 6, border: '1px solid #475569',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Wand2 size={11} /> Ubah Jenis Block
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select
                        value={convertTargetType}
                        onChange={e => setConvertTargetType(e.target.value)}
                        style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                        disabled={convertingBlock === selectedBlock.id}
                      >
                        {['heading', 'paragraph', 'bullets', 'callout']
                          .filter(t => t !== selectedBlock.type)
                          .map(t => (
                            <option key={t} value={t}>
                              {t === 'heading' ? 'Judul' :
                               t === 'paragraph' ? 'Paragraf' :
                               t === 'bullets' ? 'Bullet List' : 'Callout'}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => handleConvertBlock(selectedBlock.id, convertTargetType)}
                        disabled={convertingBlock === selectedBlock.id}
                        style={{
                          padding: '7px 10px',
                          background: convertingBlock === selectedBlock.id 
                            ? '#475569'
                            : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                          color: '#fff', border: 'none', borderRadius: 5,
                          cursor: convertingBlock === selectedBlock.id ? 'wait' : 'pointer',
                          fontSize: 11, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        {convertingBlock === selectedBlock.id ? '...' : <><Sparkles size={11} /> Ubah</>}
                      </button>
                    </div>
                    {aiError && convertingBlock === null && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#FCA5A5' }}>
                        {aiError}
                      </div>
                    )}
                  </div>
                )}

                {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph' || selectedBlock.type === 'callout') && (
                  <>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
                      <button onMouseDown={(e) => { e.preventDefault(); applyBold(); }} style={fmtBtn}><Bold size={13} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); applyItalic(); }} style={fmtBtn}><Italic size={13} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} style={fmtBtn}>×</button>
                    </div>
                    <Label text="Stabilo (pilih teks dulu)" />
                    <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
                      {HIGHLIGHT_PRESETS.map(h => (
                        <button
                          key={h.color}
                          onMouseDown={(e) => { e.preventDefault(); applyHighlight(h.color); }}
                          style={{ width: 26, height: 26, borderRadius: 999, background: h.color, border: '1px solid #334155', cursor: 'pointer' }}
                          title={h.name}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, color: '#94A3B8' }}>
                      <span>Custom:</span>
                      <input
                        type="color"
                        onChange={(e) => applyHighlight(e.target.value)}
                        style={{ width: 30, height: 26, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
                        title="Pilih warna custom"
                      />
                      <button
                        onMouseDown={(e) => { e.preventDefault(); applyHighlight('transparent'); }}
                        style={{
                          padding: '4px 8px', fontSize: 10, background: '#334155',
                          color: '#E2E8F0', border: 'none', borderRadius: 4, cursor: 'pointer',
                        }}
                        title="Hapus stabilo dari teks terpilih"
                      >
                        Hapus
                      </button>
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
                    {selectedBlock.src && (
                      <button
                        onClick={() => reCropBlockImage(selectedBlock.id)}
                        style={{
                          ...inputStyle, background: '#334155', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          marginBottom: 8,
                        }}
                      >
                        <Crop size={12} /> Atur Crop Gambar
                      </button>
                    )}
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
                    
                    <Label text="Posisi" />
                    <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                      {[
                        { val: 'left', label: '← Kiri' },
                        { val: 'center', label: '↔ Tengah' },
                        { val: 'right', label: 'Kanan →' },
                      ].map(a => (
                        <button
                          key={a.val}
                          onClick={() => updateBlock(selectedBlock.id, { align: a.val })}
                          style={{
                            ...inputStyle,
                            background: (selectedBlock.align || 'center') === a.val ? '#3B82F6' : '#334155',
                            cursor: 'pointer', textAlign: 'center', fontSize: 11,
                          }}
                        >
                          {a.label}
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
                    
                    {/* === STROKE === */}
                    <div style={{
                      marginTop: 12, padding: 10, background: '#1E293B',
                      borderRadius: 6, border: '1px solid #334155',
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={selectedBlock.strokeEnabled || false}
                          onChange={e => updateBlock(selectedBlock.id, { strokeEnabled: e.target.checked })}
                        />
                        Bingkai (Stroke)
                      </label>
                      {selectedBlock.strokeEnabled && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                            <span style={{ fontSize: 11, color: '#94A3B8', minWidth: 40 }}>Warna:</span>
                            <input
                              type="color"
                              value={selectedBlock.strokeColor || '#111827'}
                              onChange={e => updateBlock(selectedBlock.id, { strokeColor: e.target.value })}
                              style={{ width: 32, height: 26, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>Tebal:</span>
                            <input
                              type="number"
                              min={1} max={20}
                              value={selectedBlock.strokeWidth || 4}
                              onChange={e => updateBlock(selectedBlock.id, { strokeWidth: Number(e.target.value) })}
                              style={{ ...inputStyle, width: 50, padding: '4px 6px' }}
                            />
                            <span style={{ fontSize: 10, color: '#64748B' }}>px</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* === SHADOW === */}
                    <div style={{
                      marginTop: 8, padding: 10, background: '#1E293B',
                      borderRadius: 6, border: '1px solid #334155',
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={selectedBlock.shadowEnabled || false}
                          onChange={e => updateBlock(selectedBlock.id, { shadowEnabled: e.target.checked })}
                        />
                        Bayangan (Shadow)
                      </label>
                      {selectedBlock.shadowEnabled && (
                        <>
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                              <span>Ukuran</span>
                              <span>{selectedBlock.shadowSize || 8}px</span>
                            </div>
                            <input
                              type="range" min={2} max={40} step={2}
                              value={selectedBlock.shadowSize || 8}
                              onChange={e => updateBlock(selectedBlock.id, { shadowSize: Number(e.target.value) })}
                              style={{ width: '100%', accentColor: '#3B82F6' }}
                            />
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                              <span>Kepekatan</span>
                              <span>{Math.round((selectedBlock.shadowOpacity || 0.15) * 100)}%</span>
                            </div>
                            <input
                              type="range" min={0.05} max={0.6} step={0.05}
                              value={selectedBlock.shadowOpacity || 0.15}
                              onChange={e => updateBlock(selectedBlock.id, { shadowOpacity: Number(e.target.value) })}
                              style={{ width: '100%', accentColor: '#3B82F6' }}
                            />
                          </div>
                        </>
                      )}
                    </div>
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

                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <label style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Ukuran</label>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{selectedBlock.size}px</span>
                      </div>
                      <input
                        type="range"
                        min={selectedBlock.type === 'heading' ? 30 : 16}
                        max={selectedBlock.type === 'heading' ? 120 : 80}
                        step={1}
                        value={selectedBlock.size}
                        onChange={e => updateBlock(selectedBlock.id, { size: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#3B82F6' }}
                      />
                    </div>

                    <Label text="Weight" />
                    <select
                      value={selectedBlock.weight}
                      onChange={e => updateBlock(selectedBlock.id, { weight: Number(e.target.value) })}
                      style={inputStyle}
                    >
                      {[300, 400, 500, 600, 700, 800].map(w => <option key={w}>{w}</option>)}
                    </select>

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
              <br />→ Deteksi <code style={{ background: '#334155', padding: '1px 5px', borderRadius: 3, color: '#FBBF24' }}>*bold*</code>, <code style={{ background: '#334155', padding: '1px 5px', borderRadius: 3, color: '#FBBF24' }}>_italic_</code>, <code style={{ background: '#334155', padding: '1px 5px', borderRadius: 3, color: '#FBBF24' }}>~strike~</code> dari WhatsApp
              <br />→ Pilih struktur (paragraf / bullet / callout) per bagian
              <br />→ Highlight kata kunci penting otomatis
              <br />→ Ekstrak referensi ke catatan kaki
            </p>
            <textarea
              value={aiInputText}
              onChange={e => setAiInputText(e.target.value)}
              rows={isMobile ? 8 : 11}
              placeholder="Tempel naskah mentah dari WhatsApp. Format *bold*, _italic_, ~strike~ akan dideteksi otomatis..."
              style={{
                width: '100%', background: '#0F172A', color: '#E2E8F0',
                padding: 10, borderRadius: 8, border: '1px solid #334155',
                fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            
            {/* Toggle: 1 slide vs allow carousel */}
            <div style={{
              marginTop: 12, padding: 12, background: '#0F172A',
              borderRadius: 8, border: '1px solid #334155',
            }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Output
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setAiAllowSplit(false)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: !aiAllowSplit ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#334155',
                    color: '#fff', border: 'none', borderRadius: 6,
                    fontWeight: 600, cursor: 'pointer', fontSize: 12,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <span>1 Feed Saja</span>
                  <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>Ringkas, muat 1 slide</span>
                </button>
                <button
                  onClick={() => setAiAllowSplit(true)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: aiAllowSplit ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#334155',
                    color: '#fff', border: 'none', borderRadius: 6,
                    fontWeight: 600, cursor: 'pointer', fontSize: 12,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <span>Boleh Carousel</span>
                  <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>Pecah jika perlu</span>
                </button>
              </div>
            </div>
            
            {/* Toggle: improve text or keep as-is */}
            <div style={{
              marginTop: 8, padding: 12, background: '#0F172A',
              borderRadius: 8, border: '1px solid #334155',
            }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Teks
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setAiImproveText(true)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: aiImproveText ? 'linear-gradient(135deg, #10B981, #059669)' : '#334155',
                    color: '#fff', border: 'none', borderRadius: 6,
                    fontWeight: 600, cursor: 'pointer', fontSize: 12,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <span>Perbaiki Teks</span>
                  <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>Edit typo, EYD, padatkan</span>
                </button>
                <button
                  onClick={() => setAiImproveText(false)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: !aiImproveText ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#334155',
                    color: '#fff', border: 'none', borderRadius: 6,
                    fontWeight: 600, cursor: 'pointer', fontSize: 12,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <span>Apa Adanya</span>
                  <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>Pertahankan teks asli</span>
                </button>
              </div>
            </div>
            
            {aiError && (
              <div style={{
                background: '#7F1D1D', color: '#FCA5A5', padding: '10px 12px',
                borderRadius: 8, marginTop: 10, fontSize: 12.5, lineHeight: 1.5,
                border: '1px solid #DC2626',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Error:</div>
                {aiError}
              </div>
            )}
            
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
      
      {/* ===== IMAGE CROPPER MODAL ===== */}
      {cropperState && (
        <ImageCropper
          imageSrc={cropperState.rawSrc}
          aspectRatio={cropperState.aspectRatio}
          shape={cropperState.shape}
          initialCrop={cropperState.initialCrop}
          onSave={cropperState.onSave}
          onCancel={() => setCropperState(null)}
        />
      )}
      
      {/* ===== OVERFLOW POPUP ===== */}
      {overflowPopup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: 16,
        }}>
          <div style={{
            background: '#1E293B', padding: 20, borderRadius: 16, maxWidth: 420, width: '100%',
            border: '1px solid #475569',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertCircle size={20} color="#F59E0B" />
              <div style={{ fontWeight: 700, fontSize: 16, color: '#F1F5F9' }}>Konten Melebihi Slide</div>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Konten slide ini lebih besar dari ukuran feed. Mau diapain?
            </p>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button
                onClick={() => { overflowPopup.onShrink(); setOverflowPopup(null); }}
                style={{
                  padding: '12px 16px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <ZoomOut size={14} /> Kecilkan otomatis agar muat
              </button>
              <button
                onClick={() => { overflowPopup.onSplit(); setOverflowPopup(null); }}
                style={{
                  padding: '12px 16px', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Plus size={14} /> Pisah ke slide baru
              </button>
              <button
                onClick={() => setOverflowPopup(null)}
                style={{
                  padding: '10px 16px', background: '#334155', color: '#E2E8F0',
                  border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
                }}
              >
                Batal
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
  background: bg, color: '#fff', border: 'none',
  padding: '8px 10px', borderRadius: 8,
  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 12,
});

const mobileTabBtn = (active) => ({
  background: active ? '#3B82F6' : '#334155', color: '#fff', border: 'none',
  width: 32, height: 32, borderRadius: 7, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const navBtnStyle = {
  background: '#334155', color: '#fff', border: 'none',
  padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
};

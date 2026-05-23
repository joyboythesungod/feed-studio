// Vercel Serverless Function — transform block ke jenis lain via AI
// Endpoint: /api/transform-block

function parseWhatsAppFormatting(text) {
  if (!text) return text;
  let result = text;
  result = result.replace(/\[REF:\s*([^\]]+)\]/g, '<span class="ref-note" style="display:block;font-size:0.6em;color:#6B7280;font-style:italic;margin-top:4px;font-family:\'Montserrat\',sans-serif;direction:ltr;">$1</span>');
  result = result.replace(/`([^`\n]+)`/g, '<code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
  result = result.replace(/(^|\s|>|\(|"|\[)\*([^\*\n]+?)\*(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<b>$2</b>');
  result = result.replace(/(^|\s|>|\(|"|\[)_([^_\n]+?)_(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<i>$2</i>');
  result = result.replace(/(^|\s|>|\(|"|\[)~([^~\n]+?)~(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<s>$2</s>');
  return result;
}

// Strip HTML tags for clean input to AI
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<mark[^>]*>(.*?)<\/mark>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    .replace(/<s>(.*?)<\/s>/gi, '~$1~')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const { block, targetType } = req.body;
    if (!block || !targetType) return res.status(400).json({ error: 'block dan targetType wajib diisi' });

    // Ekstrak teks asli dari block
    let originalContent = '';
    if (block.type === 'bullets' && Array.isArray(block.items)) {
      originalContent = block.items.map(it => '- ' + stripHtml(it)).join('\n');
    } else {
      originalContent = stripHtml(block.text || '');
    }

    if (!originalContent.trim()) return res.status(400).json({ error: 'Block tidak punya konten' });

    const typeDescriptions = {
      heading: 'JUDUL: singkat, kuat, statement utama (max 12 kata, biasanya 4-8 kata). Output: { "type": "heading", "text": "..." }',
      paragraph: 'PARAGRAPH: penjelasan naratif 1-3 kalimat. Output: { "type": "paragraph", "text": "...", "highlights": [{ "phrase": "...", "color": "#FECDD3" }] }',
      bullets: 'BULLETS: pecah jadi daftar 3-5 poin singkat dan sejenis. Output: { "type": "bullets", "icon": "check|x|arrow-right|star|warning|heart", "items": ["...", "..."] }',
      callout: 'CALLOUT: kotak penekanan untuk insight/kutipan kunci. 1-2 kalimat. Output: { "type": "callout", "text": "...", "bgColor": "#DBEAFE" }',
    };

    const prompt = `Kamu adalah AI yang transform sebuah block konten ke jenis lain untuk Instagram feed (akun edukasi @ardisantoso).

KONTEN BLOCK SAAT INI (jenis: ${block.type}):
"""
${originalContent}
"""

TUGAS: Ubah menjadi jenis "${targetType}" dengan adaptasi yang TEPAT.

ATURAN JENIS TARGET:
${typeDescriptions[targetType]}

ATURAN ADAPTASI:
- Pertahankan MAKNA INTI, jangan tambah informasi baru yang tidak ada di input.
- Sesuaikan struktur dengan jenis target.
- Untuk transform PARAGRAPH → BULLETS: pecah kalimat jadi poin-poin sejenis. Pilih icon yang sesuai konteks (check=positif, x=negatif/larangan, warning=peringatan, arrow-right=netral, star=highlight).
- Untuk transform BULLETS → PARAGRAPH: gabungkan poin-poin jadi naratif yang mengalir.
- Untuk transform PARAGRAPH/BULLETS → CALLOUT: ambil intisari paling kuat, ringkas jadi 1-2 kalimat penekanan.
- Untuk transform apa pun → HEADING: ekstrak statement utama, ringkas jadi judul kuat.
- PERTAHANKAN markdown WhatsApp (*bold*, _italic_) yang sudah ada.
- Tambahkan *bold* / _italic_ kalau cocok dengan jenis target (max 2-3 per block).

WARNA HIGHLIGHT/CALLOUT BG (pilih sesuai konteks):
- #FECDD3 (pink) → peringatan, larangan
- #FEF3C7 (kuning) → penekanan
- #D1FAE5 (hijau) → positif, rekomendasi
- #DBEAFE (biru) → fakta, info netral (DEFAULT untuk callout)
- #E9D5FF (ungu) → solusi, alternatif
- #FED7AA (peach) → fokus

FORMAT OUTPUT (JSON murni saja, tanpa markdown fence, tanpa penjelasan):
${typeDescriptions[targetType].split('Output: ')[1]}

Output HANYA JSON valid.`;

    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API error', detail: errText });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return res.status(500).json({ error: 'Empty response from Gemini' });

    const clean = rawText.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

    try {
      const parsed = JSON.parse(clean);
      
      // Apply WhatsApp markdown formatting
      if (parsed.text) parsed.text = parseWhatsAppFormatting(parsed.text);
      if (parsed.items && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map(it => parseWhatsAppFormatting(it));
      }
      
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Format respons tidak valid', raw: clean });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

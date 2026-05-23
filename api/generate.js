// Vercel Serverless Function — proxy ke Google Gemini API

// Helper: parse WhatsApp-style markdown to inline HTML formatting
function parseWhatsAppFormatting(text) {
  if (!text) return text;
  
  // WhatsApp markdown rules (apply in order, careful not to break each other):
  // *bold*    -> <b>bold</b>
  // _italic_  -> <i>italic</i>
  // ~strike~  -> <s>strike</s>
  // `code`    -> <code>code</code>
  
  // Use placeholder strategy to avoid conflicts
  let result = text;
  
  // Process code first (preserve its content)
  result = result.replace(/`([^`\n]+)`/g, '<code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
  
  // Bold: *text* but not ** (which is sometimes used as emphasis markers)
  // Pattern: asterisk, then non-space content (not asterisk), then asterisk
  result = result.replace(/(^|\s|>|\(|"|\[)\*([^\*\n]+?)\*(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<b>$2</b>');
  
  // Italic: _text_
  result = result.replace(/(^|\s|>|\(|"|\[)_([^_\n]+?)_(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<i>$2</i>');
  
  // Strikethrough: ~text~
  result = result.replace(/(^|\s|>|\(|"|\[)~([^~\n]+?)~(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<s>$2</s>');
  
  return result;
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
    const { text, allowSplit = false } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

    const splitInstruction = allowSplit
      ? `4. Boleh pisahkan menjadi BEBERAPA SLIDE jika konten sangat panjang dan tidak muat dalam 1 slide IG 1080x1350 dengan font readable. Target: maksimal 2-4 slide kalau memang harus dipecah.`
      : `4. PRIORITAS: muat dalam SATU SLIDE saja (1080x1350). Ringkas konten supaya cukup. Hanya pecah ke slide kedua kalau benar-benar tidak mungkin dimuat dalam 1 slide (mis. lebih dari 6 blocks atau teks sangat panjang). Default: 1 slide.`;

    const prompt = `Kamu adalah AI desainer konten edukasi kesehatan untuk Instagram (akun dr. Ardi Santoso, dokter spesialis anak).

INPUT MENTAH dari user (mungkin dari WhatsApp dengan markdown *bold*, _italic_, ~strikethrough~, atau \`code\`, atau typo, struktur acak):
"""
${text}
"""

TUGAS:
1. Perbaiki SEMUA typo, ejaan EYD, dan tata bahasa Bahasa Indonesia.
2. PERTAHANKAN markdown formatting WhatsApp yang sudah ada di input:
   - *text* (bold) → biarkan tetap *text* di output
   - _text_ (italic) → biarkan tetap _text_ di output
   - ~text~ (strikethrough) → biarkan tetap ~text~ di output
3. Tambahkan formatting markdown WhatsApp pada kata/frasa yang seharusnya ditekankan:
   - *bold* untuk kata kunci penting, larangan, peringatan, definisi
   - _italic_ untuk istilah asing (Latin, Inggris), nama produk, kutipan, atau penekanan halus
   - Jangan berlebihan — fokus pada 2-5 kata per slide saja
${splitInstruction}
5. Identifikasi struktur konten dan PILIH SECARA CERDAS jenis block:
   - "heading": judul utama slide (1 per slide, di awal, singkat & kuat, max 12 kata)
   - "paragraph": penjelasan naratif (1-3 kalimat per paragraf)
   - "bullets": daftar 3+ item (icon: check positif, x negatif, arrow-right netral, star highlight, warning peringatan)
   - "callout": kotak penekanan untuk insight/kutipan penting (1-2 kalimat)
6. Untuk paragraph dan bullets, tambahkan HIGHLIGHTS (stabilo) pada 1-3 frasa kunci yang paling penting (max 3 per slide total).
7. Identifikasi referensi/sumber → masukkan ke "footer".

FORMAT OUTPUT (JSON murni, tanpa markdown fence, tanpa penjelasan):

{
  "slides": [
    {
      "blocks": [
        { "type": "heading", "text": "..." },
        { "type": "paragraph", "text": "teks bisa mengandung *bold* atau _italic_", "highlights": [{ "phrase": "frasa di teks (TANPA markdown)", "color": "#FECDD3" }] },
        { "type": "bullets", "icon": "check|x|arrow-right|star|warning|heart", "items": ["item bisa *bold*", "item _italic_"] },
        { "type": "callout", "text": "...", "bgColor": "#DBEAFE" }
      ]
    }
  ],
  "footer": "referensi atau catatan kaki kecil, atau null"
}

WARNA HIGHLIGHT:
- #FECDD3 (pink) → peringatan, larangan, kata kunci risiko
- #FEF3C7 (kuning) → penekanan, perhatian
- #D1FAE5 (hijau) → hal positif, rekomendasi
- #DBEAFE (biru) → informasi netral, fakta
- #E9D5FF (ungu) → solusi, alternatif
- #FED7AA (peach) → fokus utama

ATURAN PENTING:
- Heading PALING max 12 kata
- Konten harus ringkas dan padat
- Jika ada list 3+ item, GUNAKAN bullets
- Jika ada penekanan/insight ringkas, GUNAKAN callout
- Untuk highlights, "phrase" harus persis teks yang akan distabilo (tanpa tanda * atau _ markdown)

Output HANYA JSON valid.`;

    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(response.status).json({ error: 'Gemini API error', detail: errText });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return res.status(500).json({ error: 'Empty response from Gemini', raw: data });

    const clean = rawText.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

    try {
      const parsed = JSON.parse(clean);
      
      // POST-PROCESS: apply WhatsApp markdown parsing to all text fields
      if (parsed.slides && Array.isArray(parsed.slides)) {
        parsed.slides.forEach(slide => {
          if (slide.blocks && Array.isArray(slide.blocks)) {
            slide.blocks.forEach(block => {
              if (block.text) {
                block.text = parseWhatsAppFormatting(block.text);
              }
              if (block.items && Array.isArray(block.items)) {
                block.items = block.items.map(item => parseWhatsAppFormatting(item));
              }
            });
          }
        });
      }
      
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: clean, parseError: parseErr.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

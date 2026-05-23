// Vercel Serverless Function — convert one block to another type via AI

function parseWhatsAppFormatting(text) {
  if (!text) return text;
  let result = text;
  result = result.replace(/`([^`\n]+)`/g, '<code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
  result = result.replace(/(^|\s|>|\(|"|\[)\*([^\*\n]+?)\*(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<b>$2</b>');
  result = result.replace(/(^|\s|>|\(|"|\[)_([^_\n]+?)_(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<i>$2</i>');
  result = result.replace(/(^|\s|>|\(|"|\[)~([^~\n]+?)~(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<s>$2</s>');
  return result;
}

// Strip HTML tags to get raw text for AI input
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<mark[^>]*>(.*?)<\/mark>/g, '$1')
    .replace(/<b>(.*?)<\/b>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '_$1_')
    .replace(/<s>(.*?)<\/s>/g, '~$1~')
    .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
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
    if (!block || !targetType) {
      return res.status(400).json({ error: 'block and targetType required' });
    }

    // Extract source content
    let sourceText = '';
    if (block.type === 'bullets' && Array.isArray(block.items)) {
      sourceText = block.items.map(it => '- ' + stripHtml(it)).join('\n');
    } else if (block.text) {
      sourceText = stripHtml(block.text);
    }

    if (!sourceText.trim()) {
      return res.status(400).json({ error: 'Block has no content to convert' });
    }

    const typeDescriptions = {
      heading: 'JUDUL utama slide — singkat, kuat, max 12 kata, format: { "type": "heading", "text": "..." }',
      paragraph: 'PARAGRAF naratif — 1-3 kalimat, format: { "type": "paragraph", "text": "...", "highlights": [{ "phrase": "frasa", "color": "#FECDD3" }] }',
      bullets: 'BULLETS — daftar 3+ item, format: { "type": "bullets", "icon": "check|x|arrow-right|star|warning|heart", "items": ["...", "..."] }',
      callout: 'CALLOUT (kotak penekanan) — 1-2 kalimat insight kuat, format: { "type": "callout", "text": "...", "bgColor": "#DBEAFE" }',
    };

    const prompt = `Kamu adalah AI desainer konten Instagram untuk akun edukasi kesehatan.

KONTEN ASAL (saat ini berupa "${block.type}"):
"""
${sourceText}
"""

TUGAS: Ubah konten di atas menjadi jenis block "${targetType}".

SPESIFIKASI ${targetType.toUpperCase()}:
${typeDescriptions[targetType] || typeDescriptions.paragraph}

ATURAN:
- Pertahankan makna asli sepenuhnya, jangan tambah info baru
- Sesuaikan struktur supaya pas dengan jenis block target
- Jika target "heading" tapi konten panjang, ekstrak inti utamanya jadi judul singkat
- Jika target "bullets" tapi konten naratif, pecah jadi 3-5 poin
- Jika target "paragraph" tapi konten bullets, gabung jadi 1-2 kalimat mengalir
- Jika target "callout" tapi konten panjang, ringkas jadi insight kunci 1-2 kalimat
- Pertahankan markdown WhatsApp (*bold*, _italic_) yang sudah ada di konten asal
- Untuk paragraph/callout, boleh tambahkan 1-2 highlights pada kata kunci penting

WARNA HIGHLIGHT (jika ada):
- #FECDD3 (pink) peringatan, #FEF3C7 (kuning) penekanan, #D1FAE5 (hijau) positif, #DBEAFE (biru) fakta, #E9D5FF (ungu) solusi, #FED7AA (peach) fokus

Output HANYA JSON valid dari satu block target, tanpa markdown fence:`;

    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1500,
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
      
      // Apply WhatsApp markdown
      if (parsed.text) parsed.text = parseWhatsAppFormatting(parsed.text);
      if (parsed.items && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map(it => parseWhatsAppFormatting(it));
      }
      
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: clean });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

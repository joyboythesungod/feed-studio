// Vercel Serverless Function — proxy ke Google Gemini API
// Endpoint: /api/generate
// Model: gemini-flash-latest (free tier, no credit card needed)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured in environment variables' });
  }

  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `Kamu adalah AI desainer konten edukasi kesehatan untuk Instagram (akun dr. Ardi Santoso, dokter spesialis anak).

INPUT MENTAH dari user (mungkin typo, struktur acak, tidak rapi):
"""
${text}
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
- #FECDD3 (pink) -> peringatan, larangan, kata kunci risiko
- #FEF3C7 (kuning) -> penekanan, perhatian
- #D1FAE5 (hijau) -> hal positif, rekomendasi
- #DBEAFE (biru) -> informasi netral, fakta
- #E9D5FF (ungu) -> solusi, alternatif
- #FED7AA (peach) -> fokus utama

ATURAN TAMBAHAN:
- Maksimal 4-5 blocks per slide supaya muat dan readable.
- Jika ada list 3+ item, GUNAKAN bullets (jangan paragraf panjang).
- Jika ada penekanan atau insight ringkas, GUNAKAN callout (jangan paragraf).
- Heading jangan lebih dari 12 kata.
- Konten harus ringkas dan padat — buang kata yang tidak perlu.

Output HANYA JSON valid.`;

    // Gemini API endpoint — pakai model gemini-flash-latest (free tier)
    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
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
      return res.status(response.status).json({ 
        error: 'Gemini API error', 
        detail: errText 
      });
    }

    const data = await response.json();
    
    // Extract text from Gemini response format
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) {
      return res.status(500).json({ error: 'Empty response from Gemini', raw: data });
    }

    // Clean potential markdown fences (just in case)
    const clean = rawText.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

    try {
      const parsed = JSON.parse(clean);
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(500).json({ 
        error: 'Failed to parse AI response as JSON', 
        raw: clean,
        parseError: parseErr.message
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

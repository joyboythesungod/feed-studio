// Vercel Serverless Function — proxy ke Google Gemini API

function parseWhatsAppFormatting(text) {
  if (!text) return text;
  let result = text;
  result = result.replace(/`([^`\n]+)`/g, '<code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
  result = result.replace(/(^|\s|>|\(|"|\[)\*([^\*\n]+?)\*(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<b>$2</b>');
  result = result.replace(/(^|\s|>|\(|"|\[)_([^_\n]+?)_(?=\s|$|<|\)|"|\]|[.,!?;:])/g, '$1<i>$2</i>');
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
      ? `Boleh pisahkan menjadi BEBERAPA SLIDE jika konten sangat panjang (target maksimal 2-4 slide).`
      : `PRIORITAS UTAMA: muat dalam SATU SLIDE saja. Ringkas konten supaya cukup.`;

    const prompt = `Kamu adalah AI desainer konten edukasi untuk Instagram akun @ardisantoso (dr. Ardi Santoso, spesialis anak).

INPUT MENTAH (mungkin dari WhatsApp dengan markdown *bold*, _italic_, ~strike~, atau typo, struktur acak):
"""
${text}
"""

PRINSIP DESAIN INTI — BACA BAIK-BAIK:

Aturan utamanya: **STRUKTUR HARUS MENGIKUTI ISI**, bukan template yang dipaksakan. Konten yang sederhana tidak butuh banyak block. Konten yang kompleks butuh struktur yang tepat. JANGAN paksakan format "judul + paragraf + bullet + callout + footer" pada SEMUA konten.

ATURAN BLOCK (gunakan dengan bijak, hanya jika BENAR-BENAR perlu):

1. **HEADING — OPSIONAL, sering tidak perlu!**
   - HANYA kasih heading kalau input mentah benar-benar punya kalimat pembuka yang berfungsi sebagai judul (singkat, kuat, statement utama)
   - Kalau input cuma penjelasan/pernyataan biasa tanpa "judul" yang jelas, JANGAN buat heading
   - Kalau ragu, lebih baik TIDAK pakai heading
   - Contoh: input "Sirup pemanis untuk minum obat TIDAK dianjurkan. Apa bedanya..." → tidak butuh heading karena kalimat pertama sudah jadi statement utama (jadi paragraph saja)
   - Contoh: input "MAKNA TERDALAM DARI IBADAH KURBAN" lalu penjelasan → heading cocok karena ada judul eksplisit

2. **PARAGRAPH — paling sering digunakan**
   - Untuk penjelasan naratif, statement, pernyataan
   - 1-3 kalimat per paragraf
   - Bisa berdiri sendiri tanpa heading

3. **BULLETS — hanya kalau memang ada daftar**
   - HANYA jika input punya minimal 3 poin yang sejenis (gejala, langkah, tips, dll)
   - Kalau cuma 2 poin, lebih baik gabung jadi paragraph
   - JANGAN paksakan bullets pada konten yang naratif

4. **CALLOUT (kotak penekanan) — JARANG, hanya untuk kutipan/insight kunci**
   - HANYA jika ada kutipan, kesimpulan kuat, atau insight yang benar-benar perlu dipisahkan secara visual dari sekitarnya
   - JANGAN kasih callout pada penutup standar atau kalimat biasa
   - 1 callout per slide maksimal, dan seringkali TIDAK perlu sama sekali
   - Contoh cocok: "Mending pakai air buah alami atau air madu untuk minum obat" (alternatif/saran kuat) → callout cocok
   - Contoh TIDAK cocok: "Sebab pada hakikatnya, apa pun yang kita miliki di dunia hanyalah titipan" (penutup naratif biasa) → cukup paragraph

5. **FOOTER (catatan kaki) — HANYA kalau ada referensi/sumber eksplisit**
   - Set footer = null KECUALI input punya bagian referensi yang jelas
   - Indikator referensi: kata "Referensi:", "Sumber:", "Daftar pustaka:", daftar bernomor jurnal/pedoman/buku di akhir konten, sitasi seperti "(WHO, 2024)" dengan daftar di bawah
   - Tanda tangan seperti "— dr. Ardi Santoso" BUKAN referensi, masukkan di akhir konten utama saja atau abaikan
   - JANGAN buat-buat footer kalau memang tidak ada di input

CONTOH KEPUTUSAN STRUKTUR:

Contoh A — Input pendek pernyataan + alternatif:
"Sirup pemanis untuk minum obat tidak dianjurkan. Apa bedanya dengan minuman pemanis buatan? Mending pakai air buah alami atau air madu."
→ Struktur tepat: 1 paragraph (statement utama) + 1 paragraph (pertanyaan retoris) + 1 callout (alternatif kuat). TIDAK butuh heading, TIDAK butuh footer.

Contoh B — Input dengan daftar gejala:
"Hati-hati DBD pada anak. Gejala awal: demam tinggi mendadak, nyeri perut, mual muntah, bintik merah di kulit, lemas. Segera periksakan ke dokter."
→ Struktur tepat: 1 paragraph (statement) + 1 bullets (gejala dengan warning icon) + 1 paragraph (call to action). TIDAK butuh heading (statement sudah jelas), TIDAK butuh callout, TIDAK butuh footer.

Contoh C — Input dengan judul eksplisit + referensi:
"DAFTAR Vitamin Anak: Mana yang Perlu Tiap Hari. 1. Vitamin D - setiap hari, terutama bayi ASI. 2. Zat Besi - setiap hari... Referensi: 1. AAP 2. IDAI"
→ Struktur tepat: 1 heading + 1 bullets + footer berisi referensi. Heading dipakai karena ada judul eksplisit. Footer dipakai karena ada referensi eksplisit.

FORMATTING WHATSAPP MARKDOWN:
- PERTAHANKAN *bold*, _italic_, ~strike~ yang sudah ada di input
- TAMBAHKAN *bold* pada 2-3 kata kunci paling penting per slide (larangan, definisi, peringatan utama)
- TAMBAHKAN _italic_ pada istilah Latin/Inggris/nama produk
- Jangan berlebihan

HIGHLIGHT (STABILO) — terpisah dari bold/italic:
- Untuk frasa yang ingin di-stabilo (bukan kata individual)
- Maksimal 2-3 highlight per slide
- Pilih warna sesuai konteks:
  - #FECDD3 (pink) → peringatan, larangan, risiko
  - #FEF3C7 (kuning) → penekanan, perhatian
  - #D1FAE5 (hijau) → positif, rekomendasi
  - #DBEAFE (biru) → fakta, info netral
  - #E9D5FF (ungu) → solusi, alternatif
  - #FED7AA (peach) → fokus utama

SPLIT INSTRUCTION: ${splitInstruction}

LAINNYA:
- Perbaiki typo dan ejaan EYD
- Konten ringkas, padat, buang kata tidak perlu
- Jangan tambahkan info yang tidak ada di input

FORMAT OUTPUT (JSON murni, tanpa markdown fence, tanpa penjelasan):

{
  "slides": [
    {
      "blocks": [
        // Susun block sesuai kebutuhan konten. Block yang tidak perlu, JANGAN dimasukkan.
        // Jenis block: "heading" | "paragraph" | "bullets" | "callout"
        { "type": "paragraph", "text": "teks bisa mengandung *bold* atau _italic_", "highlights": [{ "phrase": "frasa tanpa markdown", "color": "#FECDD3" }] }
      ]
    }
  ],
  "footer": null
}

PENTING: 
- "footer" = null kalau tidak ada referensi/sumber eksplisit di input
- Blocks tidak harus selalu lengkap heading+paragraph+bullets+callout
- Hanya pakai jenis block yang BENAR-BENAR sesuai konten

Output HANYA JSON valid.`;

    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
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
      
      // Post-process: apply WhatsApp markdown
      if (parsed.slides && Array.isArray(parsed.slides)) {
        parsed.slides.forEach(slide => {
          if (slide.blocks && Array.isArray(slide.blocks)) {
            slide.blocks.forEach(block => {
              if (block.text) block.text = parseWhatsAppFormatting(block.text);
              if (block.items && Array.isArray(block.items)) {
                block.items = block.items.map(item => parseWhatsAppFormatting(item));
              }
            });
          }
        });
      }
      
      // Normalize footer: null/empty string/whitespace → null
      if (!parsed.footer || !String(parsed.footer).trim()) {
        parsed.footer = null;
      }
      
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: clean, parseError: parseErr.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

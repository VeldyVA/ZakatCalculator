export async function sendToAI(parsedData: any) {
  const prompt = `Saya memiliki data aset pribadi seperti ini:\n\n${JSON.stringify(parsedData, null, 2)}\n\n
Tolong klasifikasikan dan ubah ke dalam struktur JSON berikut untuk perhitungan zakat maal:

{
  "uangTunaiTabunganDeposito": {
    "usd": (jumlah dalam USD jika ada, atau 0),
    "idr": (jumlah dalam rupiah jika ada, atau 0)
  },
  "emasPerakGram": (jumlah gram emas/perak jika ada),
  "returnInvestasiTahunan": (return tahunan dalam rupiah),
  "returnPropertiTahunan": (return sewa properti dalam rupiah),
  "hutangJangkaPendek": (hutang jangka pendek dalam rupiah)
}

Catatan:
- Jika ada aset berlabel dolar, USD, atau sejenisnya, masukkan ke bagian "usd"
- Jika ada catatan seperti "emas 10 gr", "perhiasan 7 gram", jumlahkan ke emasPerakGram
- Return investasi dan sewa properti hanya isi keuntungan tahunan, bukan nilai pokok
- Jawaban HARUS dalam bentuk JSON valid, tanpa penjelasan`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'Kamu adalah asisten zakat' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const raw = await res.text();

  try {
    const json = JSON.parse(raw);
    return json;
  } catch (err) {
    console.error('❌ Gagal parsing JSON dari AI:\n', raw);
    throw new Error('Invalid JSON returned by AI');
  }
}
export async function sendToAI(fileContent: string, zakatType: 'harta' | 'perusahaan' | 'profesi') {
  let prompt = `Saya memiliki data ${zakatType} seperti ini:\n\n${fileContent}\n\n`;

  if (zakatType === 'harta') {
    prompt += `Tolong klasifikasikan dan ubah ke dalam struktur JSON berikut untuk perhitungan zakat maal:

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
  } else if (zakatType === 'perusahaan') {
    prompt += `Tolong klasifikasikan dan ubah ke dalam struktur JSON berikut untuk perhitungan zakat perusahaan:

{
  "cash": (kas perusahaan),
  "inventory": (persediaan),
  "receivables": (piutang),
  "shortTermDebt": (hutang jangka pendek)
}

Catatan:
- Jawaban HARUS dalam bentuk JSON valid, tanpa penjelasan`;
  } else if (zakatType === 'profesi') {
    prompt += `Tolong klasifikasikan dan ubah ke dalam struktur JSON berikut untuk perhitungan zakat profesi:

{
  "monthlyIncome": (pendapatan bulanan)
}

Catatan:
- Jawaban HARUS dalam bentuk JSON valid, tanpa penjelasan`;
  }

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
  } catch (error: unknown) {
    console.error('❌ Gagal parsing JSON dari AI:', error, '\nRaw response:\n', raw);
    throw new Error('Invalid JSON returned by AI');
  }
}
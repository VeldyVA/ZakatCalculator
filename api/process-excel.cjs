const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Fungsi untuk memfilter konten teks yang lebih canggih
function preprocessFinancialText(text) {
  // 1. Normalisasi spasi dan ganti baris baru dengan spasi
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  // 2. Daftar kata kunci yang lebih komprehensif
  const keywords = [
    // Aset Lancar (Current Assets)
    'kas dan setara kas', 'kas', 'bank', 'cash and cash equivalents', 'cash', 'bank',
    'piutang usaha', 'piutang', 'accounts receivable', 'receivables',
    'persediaan', 'inventories', 'inventory',
    'aset lancar lainnya', 'other current assets',
    'total aset lancar', 'total current assets',

    // Kewajiban Jangka Pendek (Current Liabilities)
    'utang usaha', 'hutang usaha', 'accounts payable',
    'utang jangka pendek', 'hutang jangka pendek', 'short-term debt', 'short-term borrowings',
    'beban akrual', 'accrued expenses',
    'utang pajak', 'tax payable',
    'kewajiban jangka pendek lainnya', 'other current liabilities',
    'total kewajiban jangka pendek', 'total current liabilities',
    
    // Istilah Umum Laporan Keuangan
    'neraca', 'laporan posisi keuangan', 'balance sheet', 'statement of financial position',
    'laba rugi', 'income statement'
  ];

  // 3. Pisahkan teks menjadi "kalimat" atau potongan yang diakhiri dengan titik atau jeda signifikan
  const sentences = normalizedText.split(/\.\s|\s{4,}/); // Membagi berdasarkan titik atau spasi panjang

  const relevantSentences = sentences.filter(sentence => {
    if (sentence.length < 5) return false; // Abaikan potongan yang sangat pendek
    const lowerSentence = sentence.toLowerCase();
    // Simpan kalimat jika mengandung kata kunci DAN angka
    const hasKeyword = keywords.some(keyword => lowerSentence.includes(keyword));
    const hasNumber = /\d/.test(sentence);
    return hasKeyword && hasNumber;
  });

  // 4. Jika tidak ada yang relevan, kembalikan teks asli yang sudah dinormalisasi
  if (relevantSentences.length === 0) {
    // Sebagai fallback, coba metode pencarian baris demi baris jika pemisahan kalimat gagal
    const lines = text.split(/\r?\n/);
    const relevantLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        const hasKeyword = keywords.some(keyword => lowerLine.includes(keyword));
        const hasNumber = /\d/.test(line);
        return hasKeyword && hasNumber;
    });
    if (relevantLines.length > 0) {
        return relevantLines.join('\n');
    }
    return normalizedText; // Kembalikan teks yang sudah dinormalisasi jika semua gagal
  }

  return relevantSentences.join('. ');
}


module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileContent, zakatType } = req.body;

  if (!fileContent || !zakatType) {
    return res.status(400).json({ message: 'Missing fileContent or zakatType' });
  }

  // Pra-pemrosesan konten file sebelum dikirim ke AI
  const processedContent = preprocessFinancialText(fileContent);
  console.log("Original content length:", fileContent.length);
  console.log("Processed content length:", processedContent.length);


  let systemPrompt = "";

  if (zakatType === 'harta') {
    systemPrompt = `
      You are a helpful assistant. A user has uploaded financial data.
      Your task is to extract the relevant information and format it as a JSON object.
      The JSON object must strictly adhere to the following structure for "harta" (wealth) zakat calculation:
      {
        "uangTunaiTabunganDeposito": {
          "usd": number, // Amount in USD. If multiple values, sum them up and provide the single numeric result. Use 0 if not found.
          "idr": number  // Amount in IDR. If multiple values, sum them up and provide the single numeric result. Use 0 if not found.
        },
        "emasPerakGram": number, // Amount in grams of gold/silver. If multiple values, sum them up and provide the single numeric result. Use 0 if not found.
        "returnInvestasiTahunan": number, // Annual investment return in IDR. If multiple values, sum them up and provide the single numeric result. Use 0 if not found.
        "returnPropertiTahunan": number, // Annual rental property return in IDR. If multiple values, sum them up and provide the single numeric result. Use 0 if not found.
        "hutangJangkaPendek": number // Short-term debt in IDR. If multiple values, sum them up and provide the single numeric result. Use 0 if not found.
      }

      Analyze the provided text content and populate the JSON object. Ensure all fields are present and contain only final numeric values (no mathematical expressions or operators).
      Return ONLY the JSON object, no other text or explanation.
    `;
  } else if (zakatType === 'perusahaan') {
    systemPrompt = `
      You are an expert financial data extraction AI. Your task is to analyze financial text and output a clean, flat JSON object.

      **CRITICAL RULES:**
      1.  **CALCULATE SUMS:** If a value is composed of multiple numbers (e.g., "Piutang Usaha: 100, Piutang Lain: 50"), you MUST calculate the total sum internally (e.g., 150).
      2.  **FINAL NUMBERS ONLY:** The value for each JSON key MUST be a single integer or float (e.g., \`150\`), NOT a string containing a formula (e.g., \`"100+50"\`).
      3.  **NO NESTING:** The final output MUST be a single, flat JSON object. DO NOT wrap it inside other keys like "perusahaan".
      4.  **USE 0 FOR MISSING VALUES:** If you cannot find a value for a field, use \`0\`.

      The JSON object must strictly adhere to this exact structure:
      {
        "cash": number,
        "inventory": number,
        "receivables": number,
        "shortTermDebt": number,
        "longTermDebt": number
      }

      Return ONLY the raw JSON object and nothing else.
    `;
  } else if (zakatType === 'profesi') {
    systemPrompt = `
      You are a helpful assistant. A user has uploaded an Excel file with their professional income data.
      Your task is to extract the relevant information and format it as a JSON object.
      The JSON object should contain the following fields for "profesi" (professional) zakat calculation:
      - "monthlyIncome": number
      - "otherIncome": number
      - "monthlyExpense": number
      - "nisab": number
      - "goldPrice": number
      - "currency": string

      Analyze the following text content from an Excel file and provide the JSON object.
      If a value is not found, use 0.
    `;
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",          content: `Analyze the following financial text and extract the data into the JSON format specified in the system instructions. Text to analyze:

${processedContent}`,        },      ],      model: "llama3-8b-8192",
      temperature: 0,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    try {
      const parsedContent = JSON.parse(content);
      res.status(200).json(parsedContent);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError);
      console.error('Groq response content:', content);
      res.status(500).json({ message: 'AI returned invalid data' });
    }
  } catch (error) {
    console.error('Error calling Groq API:', error.message || error);
    res.status(500).json({ message: 'Failed to process file with AI', details: error.message || 'Unknown error' });
  }
}
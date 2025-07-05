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
      You are a helpful assistant. A user has uploaded their company's financial data.
      Your task is to extract the relevant information and format it as a JSON object.
      
      CRITICAL INSTRUCTION: You MUST perform all calculations internally and provide only the final, single, summed-up numeric value for each field. DO NOT include any mathematical expressions or formulas (e.g., "100+200") in the JSON values. The value must be a valid number, not a string containing a formula.

      The JSON object must strictly adhere to the following structure for "perusahaan" (company) zakat calculation:
      {
        "cash": number, // Cash and cash equivalents. Sum up if multiple values. Use 0 if not found.
        "inventory": number, // Inventory value. Sum up if multiple values. Use 0 if not found.
        "receivables": number, // Current receivables. Sum up if multiple values. Use 0 if not found.
        "shortTermDebt": number, // Current liabilities only (e.g., accounts payable, short-term loans). Explicitly exclude any long-term debt. Sum up if multiple values. Use 0 if not found.
        "longTermDebt": number // Long-term debt only (e.g., long-term loans, bonds payable). Explicitly exclude any current liabilities. Sum up if multiple values. Use 0 if not found.
      }

      Analyze the provided text content and populate the JSON object. Ensure all fields are present and contain only final numeric values (no mathematical expressions or operators).
      Return ONLY the JSON object, no other text or explanation.
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
          role: "user",
          content: `Extract the following financial data from the text below and format it into the specified JSON structure. If a value is not explicitly found or is ambiguous, use 0 for that field.\n\nText content:\n${processedContent}\n\nJSON structure to fill:\n{\n  "uangTunaiTabunganDeposito": {\n    "usd": number, // Amount in USD\n    "idr": number  // Amount in IDR\n  },\n  "emasPerakGram": number, // Amount in grams of gold/silver\n  "returnInvestasiTahunan": number, // Annual investment return in IDR\n  "returnPropertiTahunan": number, // Annual rental property return in IDR\n  "hutangJangkaPendek": number // Short-term debt in IDR\n}\n\nReturn ONLY the JSON object.`, // Explicitly tell AI to return only JSON
        },
      ],
      model: "llama3-8b-8192",
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
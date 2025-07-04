const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileContent, zakatType } = req.body;

  if (!fileContent || !zakatType) {
    return res.status(400).json({ message: 'Missing fileContent or zakatType' });
  }

  let systemPrompt = "";

  if (zakatType === 'harta') {
    systemPrompt = `
      You are a helpful assistant. A user has uploaded an Excel file with their financial data.
      Your task is to extract the relevant information and format it as a JSON object.
      The JSON object should contain the following fields for "harta" (wealth) zakat calculation:
      - "uangTunaiTabunganDeposito": {
          "usd": number (jumlah dalam USD jika ada, atau 0),
          "idr": number (jumlah dalam rupiah jika ada, atau 0)
        },
      - "emasPerakGram": number (jumlah gram emas/perak jika ada),
      - "returnInvestasiTahunan": number (return tahunan dalam rupiah),
      - "returnPropertiTahunan": number (return sewa properti dalam rupiah),
      - "hutangJangkaPendek": number (hutang jangka pendek dalam rupiah)

      Analyze the following text content from an Excel file and provide the JSON object.
      If a value is not found, use 0.
    `;
  } else if (zakatType === 'perusahaan') {
    systemPrompt = `
      You are a helpful assistant. A user has uploaded an Excel file with their company's financial data.
      Your task is to extract the relevant information and format it as a JSON object.
      The JSON object should contain the following fields for "perusahaan" (company) zakat calculation:
      - "cash": number
      - "receivables": number
      - "inventory": number
      - "shortTermDebt": number
      - "longTermDebt": number
      - "equity": number
      - "nisab": number
      - "goldPrice": number
      - "currency": string

      Analyze the following text content from an Excel file and provide the JSON object.
      If a value is not found, use 0.
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
          content: fileContent,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    console.log('AI Response Content:', aiResponseContent);
    res.status(200).json(aiResponseContent);
  } catch (error) {
    console.error('Error calling Groq API:', error.message || error);
    res.status(500).json({ message: 'Failed to process file with AI', details: error.message || 'Unknown error' });
  }
}
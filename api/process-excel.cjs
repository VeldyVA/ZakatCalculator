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
      The JSON object must strictly adhere to the following structure for "perusahaan" (company) zakat calculation:
      {
        "cash": number, // Cash and cash equivalents. Sum up if multiple values. Use 0 if not found.
        "inventory": number, // Inventory value. Sum up if multiple values. Use 0 if not found.
        "receivables": number, // Current receivables. Sum up if multiple values. Use 0 if not found.
        "shortTermDebt": number, // Short-term debt (current liabilities). Sum up if multiple values. Use 0 if not found.
        "longTermDebt": number // Long-term debt. Sum up if multiple values. Use 0 if not found.
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
          content: `Extract the following financial data from the text below and format it into the specified JSON structure. If a value is not explicitly found or is ambiguous, use 0 for that field.

Text content:
${fileContent}

JSON structure to fill:
{
  "uangTunaiTabunganDeposito": {
    "usd": number, // Amount in USD
    "idr": number  // Amount in IDR
  },
  "emasPerakGram": number, // Amount in grams of gold/silver
  "returnInvestasiTahunan": number, // Annual investment return in IDR
  "returnPropertiTahunan": number, // Annual rental property return in IDR
  "hutangJangkaPendek": number // Short-term debt in IDR
}

Return ONLY the JSON object.`, // Explicitly tell AI to return only JSON
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    });

    res.status(200).json(chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error calling Groq API:', error.message || error);
    res.status(500).json({ message: 'Failed to process file with AI', details: error.message || 'Unknown error' });
  }
}
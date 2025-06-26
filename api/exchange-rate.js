
import fetch from 'node-fetch';

export default async (req, res) => {
  const oerApiUrl = 'https://openexchangerates.org/api/latest.json';
  const oerAppId = '3968afe279504a128cb5a362bcca1149'; // Your Open Exchange Rates App ID
  const staticExchangeRate = 16000; // Static USD to IDR rate for fallback

  try {
    const response = await fetch(`${oerApiUrl}?app_id=${oerAppId}&base=USD&symbols=IDR`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate from Open Exchange Rates: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (data.rates && typeof data.rates.IDR === 'number' && data.rates.IDR > 0) {
      res.status(200).json({ rates: { IDR: data.rates.IDR } });
    } else {
      console.warn("Invalid exchange rate data from Open Exchange Rates, using fallback.", data);
      res.status(200).json({ rates: { IDR: staticExchangeRate } });
    }
  } catch (error) {
    console.error("Error fetching exchange rate from Open Exchange Rates, using fallback:", error);
    res.status(200).json({ rates: { IDR: staticExchangeRate } });
  }
};

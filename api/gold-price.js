
import fetch from 'node-fetch';

export default async (req, res) => {
  const goldApiUrl = 'https://www.goldapi.io/api/XAU/USD';
  const goldApiKey = 'goldapi-3ftrvsmccz6gcq-io'; // Your GoldAPI.io Key
  const staticGoldPriceIDR = 1750000; // Rp 1,750,000 per gram
  const staticExchangeRate = 16000; // Static USD to IDR rate for fallback conversion

  try {
    const response = await fetch(goldApiUrl, {
      headers: {
        'x-access-token': goldApiKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    if (response.ok && data.price_gram_24k) {
      res.status(200).json({ price_gram_24k: data.price_gram_24k });
    } else {
      console.warn("GoldAPI.io call failed or returned invalid data, using static fallback.", data);
      const fallbackGoldPriceUSD = staticGoldPriceIDR / staticExchangeRate;
      res.status(200).json({ price_gram_24k: fallbackGoldPriceUSD });
    }
  } catch (error) {
    console.error("Error fetching from GoldAPI.io, using static fallback:", error);
    const fallbackGoldPriceUSD = staticGoldPriceIDR / staticExchangeRate;
    res.status(200).json({ price_gram_24k: fallbackGoldPriceUSD });
  }
};

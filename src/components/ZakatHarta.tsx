
import { useState, useMemo, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';

const ZakatHarta = () => {
  const [harta, setHarta] = useState({ 
    uang: 0,
    emas: 0,
    saham: 0,
    properti: 0,
  });
  const [hutang, setHutang] = useState(0);
  const [goldPriceIDR, setGoldPriceIDR] = useState(0);
  const [goldPriceUSDPerGram, setGoldPriceUSDPerGram] = useState(0); // New state for USD price
  const [exchangeRate, setExchangeRate] = useState(16000); // Default to static rate
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [calculationDate, setCalculationDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Gold Price from Vercel Serverless Function
        const goldResponse = await fetch('/api/gold-price');
        if (!goldResponse.ok) {
          throw new Error(`Failed to fetch gold price from API: ${goldResponse.statusText}`);
        }
        const goldData = await goldResponse.json();
        const fetchedGoldPriceUSDPerGram = goldData.price_gram_24k; // Use price per gram
        
        if (typeof fetchedGoldPriceUSDPerGram !== 'number' || fetchedGoldPriceUSDPerGram <= 0) {
          throw new Error('Invalid gold price received from API or fallback.');
        }
        setGoldPriceUSDPerGram(fetchedGoldPriceUSDPerGram); // Set USD price

        // Fetch Exchange Rate from Vercel Serverless Function with fallback
        let fetchedExchangeRate = 16000; // Default fallback rate
        let exchangeRateError = null;
        try {
          const exchangeResponse = await fetch('/api/exchange-rate');
          if (!exchangeResponse.ok) {
            throw new Error(`Failed to fetch exchange rate from API: ${exchangeResponse.statusText}`);
          }
          const exchangeData = await exchangeResponse.json();
          if (exchangeData.rates && typeof exchangeData.rates.IDR === 'number' && exchangeData.rates.IDR > 0) {
            fetchedExchangeRate = exchangeData.rates.IDR;
          } else {
            exchangeRateError = "Invalid exchange rate data from API, using fallback.";
            console.warn(exchangeRateError, exchangeData);
          }
        } catch (exchangeError: any) {
          exchangeRateError = `Error fetching exchange rate: ${exchangeError.message || exchangeError}. Using fallback.`;
          console.error(exchangeRateError);
        }
        setExchangeRate(fetchedExchangeRate);

        // Only set goldPriceIDR if both values are valid
        if (fetchedGoldPriceUSDPerGram > 0 && fetchedExchangeRate > 0) {
          setGoldPriceIDR(fetchedGoldPriceUSDPerGram * fetchedExchangeRate);
        } else {
          setError('Could not calculate gold price in IDR due to invalid data.');
        }

        if (exchangeRateError) {
          setError(exchangeRateError);
        }

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || 'Failed to fetch real-time data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalHarta = useMemo(() => {
    return Object.values(harta).reduce((acc, curr) => acc + curr, 0);
  }, [harta]);

  const hartaKenaZakat = useMemo(() => {
    return totalHarta - hutang;
  }, [totalHarta, hutang]);

  const nisab = useMemo(() => {
    return 85 * goldPriceIDR; // 85 grams of gold
  }, [goldPriceIDR]);

  const daysPassed = useMemo(() => {
    if (startDate && calculationDate) {
      const start = new Date(startDate);
      const calc = new Date(calculationDate);
      const diffTime = Math.abs(calc.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  }, [startDate, calculationDate]);

  const isHaulReached = useMemo(() => {
    return daysPassed >= 354;
  }, [daysPassed]);

  const zakat = useMemo(() => {
    if (hartaKenaZakat >= nisab && nisab > 0 && isHaulReached) {
      return hartaKenaZakat * 0.025;
    }
    return 0;
  }, [hartaKenaZakat, nisab, isHaulReached]);

  const handleHartaChange = (name: string, value: number) => {
    setHarta(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="text-center">Loading real-time gold price and exchange rate...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Error: {error}</div>;
  }

  return (
    <div>
      <h3>Wealth & Investment Zakat</h3>
      <div className="mb-3">
        <label className="form-label">Start Date of Wealth (Masehi)</label>
        <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Calculation Date (Masehi)</label>
        <input type="date" className="form-control" value={calculationDate} onChange={(e) => setCalculationDate(e.target.value)} />
      </div>
      {startDate && calculationDate && (
        <div className="mb-3">
          <p>Days Passed: {daysPassed} days</p>
          {isHaulReached ? (
            <p className="text-success">Haul has been reached! Zakat is obligatory.</p>
          ) : (
            <p className="text-warning">Haul not yet reached. Zakat will be obligatory in {354 - daysPassed} days.</p>
          )}
        </div>
      )}
      <hr />
      <div className="mb-3">
        <label className="form-label">Cash, Savings, Deposits</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('uang', values.floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Gold & Silver (value in IDR)</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('emas', values.floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Stocks & Other Investments</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('saham', values.floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Rental Property</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('properti', values.floatValue || 0)}
        />
      </div>
      <hr />
      <div className="mb-3">
        <label className="form-label">Debt</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => setHutang(values.floatValue || 0)}
        />
      </div>
      <hr />
      <h4>Total Wealth: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalHarta)}</h4>
      <h4>Zakat-Eligible Wealth: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(hartaKenaZakat)}</h4>
      <p>Nisab (85g Gold): {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nisab)}</p>
      <p className="text-muted">Current Gold Price: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(goldPriceUSDPerGram)}/gram (USD) @ Rp {new Intl.NumberFormat('id-ID').format(exchangeRate)}/USD = Rp {new Intl.NumberFormat('id-ID').format(goldPriceIDR)}/gram (IDR) (Source: GoldAPI.io, Exchange Rate: Open Exchange Rates with fallback)</p>
      <hr />
      <h3>Your Zakat: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakat)}</h3>
    </div>
  );
};

export default ZakatHarta;

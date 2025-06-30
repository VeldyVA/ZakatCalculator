
import { useState, useMemo, useEffect, useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import { useTranslation } from 'react-i18next';

interface ZakatPerusahaanProps {
  saveCalculation: (type: 'harta' | 'perusahaan' | 'profesi', input: any, result: number, currency: string) => void;
}

const ZakatPerusahaan: React.FC<ZakatPerusahaanProps> = ({ saveCalculation }) => {
  const { t } = useTranslation();
  const [currentAssets, setCurrentAssets] = useState({
    cash: 0,
    inventory: 0,
    receivables: 0,
  });
  const [currentLiabilities, setCurrentLiabilities] = useState(0);
  const [goldPriceIDR, setGoldPriceIDR] = useState(0);
  const [goldPriceUSDPerGram, setGoldPriceUSDPerGram] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(16000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zakat, setZakat] = useState<number | null>(null);

  const [startDate, setStartDate] = useState('');
  const [calculationDate, setCalculationDate] = useState('');
  const startDateRef = useRef<HTMLInputElement>(null);
  const calculationDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const goldResponse = await fetch('/api/gold-price');
        if (!goldResponse.ok) {
          throw new Error(`Failed to fetch gold price from API: ${goldResponse.statusText}`);
        }
        const goldData = await goldResponse.json();
        const fetchedGoldPriceUSDPerGram = goldData.price_gram_24k;
        
        if (typeof fetchedGoldPriceUSDPerGram !== 'number' || fetchedGoldPriceUSDPerGram <= 0) {
          throw new Error('Invalid gold price received from API or fallback.');
        }
        setGoldPriceUSDPerGram(fetchedGoldPriceUSDPerGram);

        let fetchedExchangeRate = 16000;
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

  const totalCurrentAssets = useMemo(() => {
    return Object.values(currentAssets).reduce((acc, curr) => acc + curr, 0);
  }, [currentAssets]);

  const zakatEligibleAssets = useMemo(() => {
    return totalCurrentAssets - currentLiabilities;
  }, [totalCurrentAssets, currentLiabilities]);

  const nisab = useMemo(() => {
    return 85 * goldPriceIDR;
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

  const handleCalculate = () => {
    const calculatedZakat = (zakatEligibleAssets >= nisab && nisab > 0 && isHaulReached) ? zakatEligibleAssets * 0.025 : 0;
    setZakat(calculatedZakat);
    if (calculatedZakat > 0) {
      saveCalculation('perusahaan', { currentAssets, currentLiabilities, startDate, calculationDate }, calculatedZakat, 'IDR');
    }
  };

  const handleAssetChange = (name: string, value: number) => {
    setCurrentAssets(prev => ({ ...prev, [name]: value }));
  };

  const handleIconClick = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.showPicker();
  };

  if (loading) {
    return <div className="text-center">{t('loadingData')}</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{t('errorPrefix', { error })}</div>;
  }

  return (
    <div>
      <h3>{t('companyZakatTitle')}</h3>
      <div className="mb-3">
        <label className="form-label">{t('startDateAssets')}</label>
        <div className="input-group">
          <span className="input-group-text" onClick={() => handleIconClick(startDateRef)} style={{ cursor: 'pointer' }}>
            <i className="bi bi-calendar"></i>
          </span>
          <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} ref={startDateRef} />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">{t('calculationDate')}</label>
        <div className="input-group">
          <span className="input-group-text" onClick={() => handleIconClick(calculationDateRef)} style={{ cursor: 'pointer' }}>
            <i className="bi bi-calendar"></i>
          </span>
          <input type="date" className="form-control" value={calculationDate} onChange={(e) => setCalculationDate(e.target.value)} ref={calculationDateRef} />
        </div>
      </div>
      {startDate && calculationDate && (
        <div className="mb-3">
          <p>{t('daysPassed', { count: daysPassed })}</p>
          {isHaulReached ? (
            <p className="text-success">{t('haulReached')}</p>
          ) : (
            <p className="text-warning">{t('haulNotReached', { days: 354 - daysPassed })}</p>
          )}
        </div>
      )}
      <hr />
      <div className="mb-3">
        <label className="form-label">{t('cashEquivalents')}</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleAssetChange('cash', values.floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">{t('inventory')}</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleAssetChange('inventory', values.floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">{t('currentReceivables')}</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleAssetChange('receivables', values.floatValue || 0)}
        />
      </div>
      <hr />
      <div className="mb-3">
        <label className="form-label">{t('currentLiabilities')}</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => setCurrentLiabilities(values.floatValue || 0)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleCalculate}>
        {t('calculateZakat')}
      </button>
      <hr />
      {zakat !== null && (
        <div>
          <h4>{t('totalCurrentAssets')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalCurrentAssets)}</h4>
          <h4>{t('zakatEligibleAssets')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakatEligibleAssets)}</h4>
          <p>{t('nisab')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nisab)}</p>
          <p className="text-muted">{t('currentGoldPrice')}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(goldPriceUSDPerGram)}{t('perGramUSD')} {new Intl.NumberFormat('id-ID').format(exchangeRate)}{t('perUSD_IDR')} {new Intl.NumberFormat('id-ID').format(goldPriceIDR)}{t('perGramIDRSource')}</p>
          <hr />
          <h3>{t('yourZakat')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakat)}</h3>
        </div>
      )}
    </div>
  );
};

export default ZakatPerusahaan;

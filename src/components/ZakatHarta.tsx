
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NumericFormat } from 'react-number-format';
import { useTranslation } from 'react-i18next';
import type { HartaInput, HartaAiData } from '../types';
import FileUploader from './FileUploader';
import { sendToAI } from '../sendToAI';

interface ZakatHartaProps {
  saveCalculation: (type: 'harta' | 'perusahaan' | 'profesi', input: HartaInput, result: number, currency: string) => void;
}

const ZakatHarta: React.FC<ZakatHartaProps> = ({ saveCalculation }) => {
  const { t } = useTranslation();
  const [harta, setHarta] = useState({
    uang: 0,
    emas: 0,
    saham: 0,
    properti: 0,
  });
  const [hutang, setHutang] = useState(0);
  const [goldPriceIDR, setGoldPriceIDR] = useState(0);
  const [goldPriceUSDPerGram, setGoldPriceUSDPerGram] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(16000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zakat, setZakat] = useState<number | null>(null);
  const [showNoZakatMessage, setShowNoZakatMessage] = useState(false);
  const [uploadedAiData, setUploadedAiData] = useState<HartaAiData | null>(null);

  const handleFileUpload = async (fileContent: string) => {
    try {
      setError(null);
      const result = await sendToAI(fileContent, 'harta');
      if (result && Object.keys(result).length > 0) {
        setUploadedAiData(JSON.parse(result));
      } else {
        setUploadedAiData(null);
        setError('AI returned empty or invalid data. Please try again or check your file content.');
      }
    } catch (error) {
      console.error('Error sending file to AI:', error);
      setError('Failed to process file with AI.');
    }
  };

  const applyUploadedData = useCallback(() => {
    if (!uploadedAiData) return;

    let totalUang = 0;
    if (uploadedAiData.uangTunaiTabunganDeposito) {
      if (uploadedAiData.uangTunaiTabunganDeposito.idr) {
        totalUang += uploadedAiData.uangTunaiTabunganDeposito.idr;
      }
      if (uploadedAiData.uangTunaiTabunganDeposito.usd && exchangeRate > 0) {
        totalUang += uploadedAiData.uangTunaiTabunganDeposito.usd * exchangeRate;
      }
    }

    let emasValue = 0;
    if (uploadedAiData.emasPerakGram !== undefined && uploadedAiData.emasPerakGram > 0 && goldPriceIDR > 0) {
      emasValue = uploadedAiData.emasPerakGram * goldPriceIDR;
    }

    const newHarta = {
      uang: totalUang,
      emas: emasValue,
      saham: uploadedAiData.returnInvestasiTahunan || 0,
      properti: uploadedAiData.returnPropertiTahunan || 0,
    };
    const newHutang = uploadedAiData.hutangJangkaPendek || 0;

    setHarta(newHarta);
    setHutang(newHutang);
    setUploadedAiData(null); // Clear uploaded data after applying
  }, [uploadedAiData, exchangeRate, goldPriceIDR]);

  useEffect(() => {
    // This useEffect is no longer needed for applying AI data directly
    // as it's now handled by applyUploadedData
  }, []);

  useEffect(() => {
    // This useEffect is no longer needed for applying AI data directly
    // as it's now handled by applyUploadedData
  }, []);

  useEffect(() => {
    if (uploadedAiData && exchangeRate > 0 && goldPriceIDR > 0) {
      applyUploadedData();
    }
  }, [uploadedAiData, exchangeRate, goldPriceIDR, applyUploadedData]);

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
        } catch (exchangeError: unknown) {
          exchangeRateError = `Error fetching exchange rate: ${(exchangeError instanceof Error ? exchangeError.message : exchangeError)}. Using fallback.`;
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

      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        setError((err instanceof Error ? err.message : String(err)) || 'Failed to fetch real-time data.');
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
    const calculatedZakat = (hartaKenaZakat >= nisab && nisab > 0 && isHaulReached) ? hartaKenaZakat * 0.025 : 0;
    setZakat(calculatedZakat);
    setShowNoZakatMessage(calculatedZakat === 0 && (hartaKenaZakat < nisab || !isHaulReached));
    saveCalculation('harta', { harta, hutang, startDate, calculationDate }, calculatedZakat, 'IDR');
  };

  const handleHartaChange = (name: string, value: number) => {
    setHarta(prev => ({ ...prev, [name]: value }));
  };

  const handleIconClick = (ref: React.RefObject<HTMLInputElement | null>) => {
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
      <h3>{t('hartaTitle')}</h3>
      <div className="mb-3">
        <label className="form-label">{t('startDate')}</label>
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

      <div className="mb-3">
        <FileUploader onFileUpload={handleFileUpload} />
        <small className="form-text text-danger fst-italic">{t('hartaFileUploadInfo')}</small>
        {uploadedAiData && (
          <button className="btn btn-info mt-2" onClick={applyUploadedData}>
            {t('continueInput')}
          </button>
        )}
      </div>
      <hr />
      <div className="mb-3">
        <label className="form-label">{t('cashSavingsDeposits')}</label>
        <NumericFormat 
          value={harta.uang}
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('uang', (values as { floatValue?: number }).floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">{t('goldAndSilver')}</label>
        <NumericFormat 
          value={harta.emas}
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('emas', (values as { floatValue?: number }).floatValue || 0)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">{t('stocksAndInvestments')}</label>
        <NumericFormat 
          value={harta.saham}
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('saham', (values as { floatValue?: number }).floatValue || 0)}
        />
        <small className="form-text text-danger fst-italic">{t('stocksInfo')}</small>
      </div>
      <div className="mb-3">
        <label className="form-label">{t('rentalProperty')}</label>
        <NumericFormat 
          value={harta.properti}
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => handleHartaChange('properti', (values as { floatValue?: number }).floatValue || 0)}
        />
        <small className="form-text text-danger fst-italic">{t('rentalInfo')}</small>
      </div>
      <hr />
      <div className="mb-3">
        <label className="form-label">{t('debt')}</label>
        <NumericFormat
          value={hutang}
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => setHutang((values as { floatValue?: number }).floatValue || 0)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleCalculate}>
        {t('calculateZakat')}
      </button>
      <hr />
      {zakat !== null && (
        <div>
          <h4>{t('totalWealth')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalHarta)}</h4>
          <h4>{t('zakatEligibleWealth')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(hartaKenaZakat)}</h4>
          <p>{t('nisab')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nisab)}</p>
          <p className="text-muted">{t('currentGoldPrice')}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(goldPriceUSDPerGram)}{t('perGramUSD')} {new Intl.NumberFormat('id-ID').format(exchangeRate)}{t('perUSD_IDR')} {new Intl.NumberFormat('id-ID').format(goldPriceIDR)}{t('perGramIDRSource')}</p>
          <hr />
          <h3>{t('yourZakat')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakat)}</h3>
          {showNoZakatMessage && (
            <p className="text-danger">{t('notObligatoryZakatWealth')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ZakatHarta;

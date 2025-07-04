import { useState, useEffect, useCallback } from 'react';
import './App.css';
import ZakatHarta from './components/ZakatHarta';
import ZakatPerusahaan from './components/ZakatPerusahaan';
import ZakatProfesi from './components/ZakatProfesi';
import ZakatHistory from './components/ZakatHistory';
import { useTranslation } from 'react-i18next';
import type { CalculationEntry, HartaInput, PerusahaanInput, ProfesiInput } from './types';

type ZakatType = 'harta' | 'perusahaan' | 'profesi' | 'history';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ZakatType>('harta');
  const [history, setHistory] = useState<CalculationEntry[]>(() => {
    const savedHistory = localStorage.getItem('zakatCalculatorHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  useEffect(() => {
    localStorage.setItem('zakatCalculatorHistory', JSON.stringify(history));
  }, [history]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const saveCalculation = useCallback((type: 'harta' | 'perusahaan' | 'profesi', input: HartaInput | PerusahaanInput | ProfesiInput, result: number, currency: string) => {
    let newEntry: CalculationEntry;
    const commonProps = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      result,
      currency,
    };

    switch (type) {
      case 'harta':
        newEntry = { ...commonProps, type: 'harta', input: input as HartaInput };
        break;
      case 'perusahaan':
        newEntry = { ...commonProps, type: 'perusahaan', input: input as PerusahaanInput };
        break;
      case 'profesi':
        newEntry = { ...commonProps, type: 'profesi', input: input as ProfesiInput };
        break;
      default:
        // This case should ideally not be reached if `type` is strictly controlled
        throw new Error("Unknown zakat type");
    }

    setHistory(prevHistory => [newEntry, ...prevHistory]);
  }, []);

  const deleteCalculation = useCallback((id: string) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'harta':
        return <ZakatHarta saveCalculation={saveCalculation} />;
      case 'perusahaan':
        return <ZakatPerusahaan saveCalculation={saveCalculation} />;
      case 'profesi':
        return <ZakatProfesi saveCalculation={saveCalculation} />;
      case 'history':
        return <ZakatHistory history={history} deleteCalculation={deleteCalculation} clearHistory={clearHistory} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-end mb-3">
        <button className="btn me-2" style={{ backgroundColor: '#FFDAB9', borderColor: '#FFDAB9', color: '#000' }} onClick={() => changeLanguage('id')}>Indonesia</button>
        <button className="btn btn-secondary me-2" onClick={() => changeLanguage('en')}>English</button>
        <button className="btn" style={{ backgroundColor: '#90EE90', borderColor: '#90EE90', color: '#000' }} onClick={() => changeLanguage('ar')}>العربية</button>
      </div>
      <h1 className="text-center mb-4">{t('title')}</h1>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'harta' ? 'active' : ''}`}
            onClick={() => setActiveTab('harta')}
          >
            {t('wealthAndInvestment')}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'perusahaan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perusahaan')}
          >
            {t('company')}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profesi' ? 'active' : ''}`}
            onClick={() => setActiveTab('profesi')}
          >
            {t('professional')}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t('history')}
          </button>
        </li>
      </ul>
      <div className="card">
        <div className="card-body">
          {renderContent()}
        </div>
      </div>
      <footer className="text-center mt-5">
        <small>veldyva</small>
      </footer>
    </div>
  );
}

export default App;

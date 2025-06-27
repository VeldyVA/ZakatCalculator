import { useState, useEffect } from 'react';
import './App.css';
import ZakatHarta from './components/ZakatHarta';
import ZakatPerusahaan from './components/ZakatPerusahaan';
import ZakatProfesi from './components/ZakatProfesi';
import ZakatHistory from './components/ZakatHistory'; // New import
import { useTranslation } from 'react-i18next';

type ZakatType = 'harta' | 'perusahaan' | 'profesi' | 'history';

interface CalculationEntry {
  id: string;
  type: 'harta' | 'perusahaan' | 'profesi';
  date: string;
  input: any;
  result: number;
  currency: string;
}

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

  const saveCalculation = (type: 'harta' | 'perusahaan' | 'profesi', input: any, result: number, currency: string) => {
    const newEntry: CalculationEntry = {
      id: Date.now().toString(),
      type,
      date: new Date().toLocaleDateString(),
      input,
      result,
      currency,
    };
    setHistory(prevHistory => [newEntry, ...prevHistory]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'harta':
        return <ZakatHarta saveCalculation={saveCalculation} />;
      case 'perusahaan':
        return <ZakatPerusahaan saveCalculation={saveCalculation} />;
      case 'profesi':
        return <ZakatProfesi saveCalculation={saveCalculation} />;
      case 'history':
        return <ZakatHistory history={history} />;
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
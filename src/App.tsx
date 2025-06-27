import { useState } from 'react';
import './App.css';
import ZakatHarta from './components/ZakatHarta';
import ZakatPerusahaan from './components/ZakatPerusahaan';
import ZakatProfesi from './components/ZakatProfesi';
import { useTranslation } from 'react-i18next';

type ZakatType = 'harta' | 'perusahaan' | 'profesi';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ZakatType>('harta');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'harta':
        return <ZakatHarta />;
      case 'perusahaan':
        return <ZakatPerusahaan />;
      case 'profesi':
        return <ZakatProfesi />;
      default:
        return null;
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-secondary me-2" onClick={() => changeLanguage('id')}>Indonesia</button>
        <button className="btn btn-secondary me-2" onClick={() => changeLanguage('en')}>English</button>
        <button className="btn btn-secondary" onClick={() => changeLanguage('ar')}>العربية</button>
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
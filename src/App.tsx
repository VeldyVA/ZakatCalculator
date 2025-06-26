import { useState } from 'react';
import './App.css';
import ZakatHarta from './components/ZakatHarta';
import ZakatPerusahaan from './components/ZakatPerusahaan';
import ZakatProfesi from './components/ZakatProfesi';

type ZakatType = 'harta' | 'perusahaan' | 'profesi';

function App() {
  const [activeTab, setActiveTab] = useState<ZakatType>('harta');

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
      <h1 className="text-center mb-4">Zakat Calculator</h1>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'harta' ? 'active' : ''}`}
            onClick={() => setActiveTab('harta')}
          >
            Wealth & Investment
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'perusahaan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perusahaan')}
          >
            Company
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profesi' ? 'active' : ''}`}
            onClick={() => setActiveTab('profesi')}
          >
            Professional
          </button>
        </li>
      </ul>
      <div className="card">
        <div className="card-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
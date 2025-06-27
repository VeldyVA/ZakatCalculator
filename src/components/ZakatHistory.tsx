import React from 'react';
import { useTranslation } from 'react-i18next';

interface CalculationEntry {
  id: string;
  type: 'harta' | 'perusahaan' | 'profesi';
  date: string;
  input: any;
  result: number;
  currency: string;
}

interface ZakatHistoryProps {
  history: CalculationEntry[];
  deleteCalculation: (id: string) => void;
}

const ZakatHistory: React.FC<ZakatHistoryProps> = ({ history, deleteCalculation }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h3>{t('historyTitle')}</h3>
      {history.length === 0 ? (
        <p>{t('noHistory')}</p>
      ) : (
        <ul className="list-group">
          {history.map(entry => (
            <li key={entry.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{t(`zakatType_${entry.type}`)}</strong> - {entry.date}<br/>
                {t('calculatedZakat')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: entry.currency }).format(entry.result)}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteCalculation(entry.id)}>{t('delete')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ZakatHistory;

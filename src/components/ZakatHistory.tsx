import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationEntry } from '../types';

interface ZakatHistoryProps {
  history: CalculationEntry[];
  deleteCalculation: (id: string) => void;
  clearHistory: () => void;
}

const ZakatHistory: React.FC<ZakatHistoryProps> = ({ history, deleteCalculation, clearHistory }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{t('historyTitle')}</h3>
        {history.length > 0 && (
          <button className="btn btn-danger" onClick={clearHistory}>
            {t('deleteAllHistory')}
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p>{t('noHistory')}</p>
      ) : (
        <ul className="list-group">
          {history.map(entry => (
            <li key={entry.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{t(`zakatType_${entry.type}`)}</strong> - {entry.date}<br/>
                {t('calculatedZakat')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: entry.currency }).format(entry.result)}
                {entry.result === 0 && (
                  <><br /><small className="text-muted fst-italic">({t('zakatNotObligatory')})</small></>
                )}
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


import { useState, useMemo, useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import { useTranslation } from 'react-i18next';

interface ZakatProfesiProps {
  saveCalculation: (type: 'harta' | 'perusahaan' | 'profesi', input: any, result: number, currency: string) => void;
}

const ZakatProfesi: React.FC<ZakatProfesiProps> = ({ saveCalculation }) => {
  const { t } = useTranslation();
  const [income, setIncome] = useState(0);
  const [zakat, setZakat] = useState<number | null>(null);
  const [paydayDate, setPaydayDate] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const ricePricePerKg = 13000;
  const nisabRiceEquivalentKg = 520;

  const nisab = useMemo(() => {
    return nisabRiceEquivalentKg * ricePricePerKg;
  }, [ricePricePerKg, nisabRiceEquivalentKg]);

  const handleCalculate = () => {
    const calculatedZakat = (income * 12 >= nisab) ? income * 0.025 : 0;
    setZakat(calculatedZakat);
    if (calculatedZakat > 0) {
      saveCalculation('profesi', { income, paydayDate }, calculatedZakat, 'IDR');
    }
  };

  const handleIconClick = () => {
    dateInputRef.current?.showPicker();
  };

  return (
    <div>
      <h3>{t('profesionalZakatTitle')}</h3>
      <div className="mb-3">
        <label className="form-label">{t('paydayDate')}</label>
        <div className="input-group">
          <span className="input-group-text" onClick={handleIconClick} style={{ cursor: 'pointer' }}>
            <i className="bi bi-calendar"></i>
          </span>
          <input type="date" className="form-control" value={paydayDate} onChange={(e) => setPaydayDate(e.target.value)} ref={dateInputRef} />
        </div>
      </div>
      {paydayDate && (
        <div className="mb-3">
          <p className="text-info">{t('profesionalZakatInfo')}</p>
        </div>
      )}
      <hr />
      <div className="mb-3">
        <label className="form-label">{t('monthlyIncome')}</label>
        <NumericFormat
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values: { floatValue: number | undefined; }) => setIncome(values.floatValue || 0)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleCalculate}>
        {t('calculateZakat')}
      </button>
      <hr />
      {zakat !== null && (
        <div>
          <h3>{t('yourMonthlyZakat')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakat)}</h3>
          <p>{t('profesionalZakatNote', { price: new Intl.NumberFormat('id-ID').format(ricePricePerKg) })}</p>
          <p>{t('currentNisabRice', { nisab: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nisab) })}</p>
        </div>
      )}
    </div>
  );
};

export default ZakatProfesi;

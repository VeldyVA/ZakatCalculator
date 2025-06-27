
import { useState, useMemo } from 'react';
import { NumericFormat } from 'react-number-format';
import { useTranslation } from 'react-i18next';

interface ZakatProfesiProps {
  saveCalculation: (type: 'harta' | 'perusahaan' | 'profesi', input: any, result: number, currency: string) => void;
}

const ZakatProfesi: React.FC<ZakatProfesiProps> = ({ saveCalculation }) => {
  const { t } = useTranslation();
  const [income, setIncome] = useState(0);

  const [paydayDate, setPaydayDate] = useState('');

  const ricePricePerKg = 13000;
  const nisabRiceEquivalentKg = 520;

  const nisab = useMemo(() => {
    return nisabRiceEquivalentKg * ricePricePerKg;
  }, [ricePricePerKg, nisabRiceEquivalentKg]);

  const zakat = useMemo(() => {
    const calculatedZakat = (income * 12 >= nisab) ? income * 0.025 : 0;
    if (calculatedZakat > 0) {
      saveCalculation('profesi', { income, paydayDate }, calculatedZakat, 'IDR');
    }
    return calculatedZakat;
  }, [income, nisab, paydayDate, saveCalculation]);

  return (
    <div>
      <h3>{t('profesionalZakatTitle')}</h3>
      <div className="mb-3">
        <label className="form-label">{t('paydayDate')}</label>
        <input type="date" className="form-control" value={paydayDate} onChange={(e) => setPaydayDate(e.target.value)} />
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
          onValueChange={(values) => setIncome(values.floatValue || 0)}
        />
      </div>
      <hr />
      <h3>{t('yourMonthlyZakat')}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakat)}</h3>
      <p>{t('profesionalZakatNote', { price: new Intl.NumberFormat('id-ID').format(ricePricePerKg) })}</p>
      <p>{t('currentNisabRice', { nisab: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nisab) })}</p>
    </div>
  );
};

export default ZakatProfesi;

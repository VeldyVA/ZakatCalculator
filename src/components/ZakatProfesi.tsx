
import { useState, useMemo } from 'react';
import { NumericFormat } from 'react-number-format';

const ZakatProfesi = () => {
  const [income, setIncome] = useState(0);

  const [paydayDate, setPaydayDate] = useState('');

  // Static rice price for Nisab calculation
  const ricePricePerKg = 13000; // Rp 13,000 per kg
  const nisabRiceEquivalentKg = 520; // 520 kg of rice

  const nisab = useMemo(() => {
    // Nisab for professional zakat based on 520 kg of rice
    return nisabRiceEquivalentKg * ricePricePerKg;
  }, [ricePricePerKg, nisabRiceEquivalentKg]);

  const zakat = useMemo(() => {
    // Zakat is 2.5% of income if annual income exceeds Nisab
    // For simplicity, we'll calculate 2.5% of monthly income here
    // and assume the user will ensure their annual income meets Nisab.
    // A more robust solution would require annual income input.
    if (income * 12 >= nisab) { // Assuming annual income check for Nisab
      return income * 0.025;
    }
    return 0;
  }, [income, nisab]);

  return (
    <div>
      <h3>Professional Zakat</h3>
      <div className="mb-3">
        <label className="form-label">Payday Date (Masehi)</label>
        <input type="date" className="form-control" value={paydayDate} onChange={(e) => setPaydayDate(e.target.value)} />
      </div>
      {paydayDate && (
        <div className="mb-3">
          <p className="text-info">Professional Zakat is calculated on each payday.</p>
        </div>
      )}
      <hr />
      <div className="mb-3">
        <label className="form-label">Monthly Income</label>
        <NumericFormat 
          className="form-control"
          thousandSeparator={true}
          prefix={'Rp '}
          onValueChange={(values) => setIncome(values.floatValue || 0)}
        />
      </div>
      <hr />
      <h3>Your Monthly Zakat: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(zakat)}</h3>
      <p>Note: Professional Zakat is 2.5% of gross income if annual income exceeds Nisab (equivalent to 520kg of rice at Rp {new Intl.NumberFormat('id-ID').format(ricePricePerKg)}/kg).</p>
      <p>Current Nisab (520kg Rice): {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nisab)}</p>
    </div>
  );
};

export default ZakatProfesi;

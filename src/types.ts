export interface CalculationEntry {
  id: string;
  type: 'harta' | 'perusahaan' | 'profesi';
  date: string;
  input: any;
  result: number;
  currency: string;
}

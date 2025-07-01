export interface HartaInput {
  harta: {
    uang: number;
    emas: number;
    saham: number;
    properti: number;
  };
  hutang: number;
  startDate: string;
  calculationDate: string;
}

export interface PerusahaanInput {
  currentAssets: {
    cash: number;
    inventory: number;
    receivables: number;
  };
  currentLiabilities: number;
  startDate: string;
  calculationDate: string;
}

export interface ProfesiInput {
  income: number;
  paydayDate: string;
}

export type CalculationEntry =
  | { id: string; type: 'harta'; date: string; input: HartaInput; result: number; currency: string; }
  | { id: string; type: 'perusahaan'; date: string; input: PerusahaanInput; result: number; currency: string; }
  | { id: string; type: 'profesi'; date: string; input: ProfesiInput; result: number; currency: string; };
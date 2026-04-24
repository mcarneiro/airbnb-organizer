import { describe, it, expect, beforeEach } from 'vitest';
import { BrazilianRentalTaxCalculator } from '../BrazilianRentalTaxCalculator';

describe('BrazilianRentalTaxCalculator', () => {
  let calculator: BrazilianRentalTaxCalculator;

  beforeEach(() => {
    calculator = new BrazilianRentalTaxCalculator(2025);
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly for a high income scenario with simplified deduction', () => {
      // Given
      const liquidIncome = 9900.00; // 10000 - 100
      const dependents = 2;
      
      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      // Deduction: MAX(2 * 189.59 = 379.18, 607.20) = 607.20
      // Taxable Income: 9900.00 - 607.20 = 9292.80
      // Tax Bracket (PRD): > 4664.68 -> 27.5% - 908.73
      // Tax: (9292.80 * 0.275) - 908.73 = 2555.52 - 908.73 = 1646.79
      
      expect(result.deduction).toBe(607.20);
      expect(result.taxableIncome).toBe(9292.80);
      expect(result.taxRate).toBe(0.275);
      expect(result.taxOwed).toBe(1646.79);
    });

    it('should use dependent deduction if it is greater than simplified deduction', () => {
      // Given
      const liquidIncome = 5000.00;
      const dependents = 4; // 4 * 189.59 = 758.36 (> 607.20)
      
      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      expect(result.deduction).toBe(758.36);
      expect(result.taxableIncome).toBe(4241.64);
    });
  });
});

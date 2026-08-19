import { describe, it, expect, beforeEach } from 'vitest';
import { BrazilianRentalTaxCalculator } from '../BrazilianRentalTaxCalculator';

describe('BrazilianRentalTaxCalculator 2026 Rules', () => {
  let calculator: BrazilianRentalTaxCalculator;

  beforeEach(() => {
    calculator = new BrazilianRentalTaxCalculator(2026);
  });

  describe('calculateTax (2026)', () => {
    it('exposes a full reduction capped at the base tax for income up to R$ 5,000', () => {
      // Given
      const liquidIncome = 5000.00;
      const dependents = 0;

      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      expect(result.taxBefore2026Reduction).toBe(299.29);
      expect(result.taxReduction2026).toBe(299.29);
      expect(result.taxOwed).toBe(0);
    });

    it('should result in zero tax for income up to R$ 5,000', () => {
      // Given
      const liquidIncome = 5000.00;
      const dependents = 0;
      
      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      expect(result.taxOwed).toBe(0);
    });

    it('should apply partial reduction for income between R$ 5,000 and R$ 7,350', () => {
      // Given
      const liquidIncome = 6000.00;
      const dependents = 0;
      
      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      // Base Tax Calculation (Simplified):
      // Taxable Income: 6000 - 607.20 = 5392.80
      // Base Tax (27.5%): (5392.80 * 0.275) - 908.73 = 1483.02 - 908.73 = 574.29
      // Reducer: 978.62 - (0.133145 * 6000) = 978.62 - 798.87 = 179.75
      // Final Tax: 574.29 - 179.75 = 394.54
      expect(result.taxOwed).toBe(394.54);
    });

    it('exposes the partial 2026 reduction applied to the base tax', () => {
      // Given
      const liquidIncome = 6133.07;
      const dependents = 0;

      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      expect(result.taxBefore2026Reduction).toBe(610.88);
      expect(result.taxReduction2026).toBe(162.03);
      expect(result.taxOwed).toBe(448.85);
    });

    it('should apply NO reduction for income above R$ 7,350', () => {
      // Given
      const liquidIncome = 8000.00;
      const dependents = 0;
      
      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      // Taxable Income: 8000 - 607.20 = 7392.80
      // Tax (27.5%): (7392.80 * 0.275) - 908.73 = 2033.02 - 908.73 = 1124.29
      expect(result.taxOwed).toBe(1124.29);
    });

    it('exposes no 2026 reduction for income above R$ 7,350', () => {
      // Given
      const liquidIncome = 8000.00;
      const dependents = 0;

      // When
      const result = calculator.calculateTax(liquidIncome, dependents);

      // Then
      expect(result.taxBefore2026Reduction).toBe(1124.29);
      expect(result.taxReduction2026).toBe(0);
      expect(result.taxOwed).toBe(1124.29);
    });
  });
});

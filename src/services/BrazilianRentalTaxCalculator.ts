import { TaxCalculator, TaxBracket } from '../types';

/**
 * Brazilian Rental Income Tax Calculator
 *
 * Implements the Strategy Pattern for tax calculations
 * Supports 2025 and 2026 tax rules
 */
export class BrazilianRentalTaxCalculator implements TaxCalculator {
  private year: number;

  // Tax constants
  private static readonly DEPENDENT_DEDUCTION = 189.59;
  private static readonly SIMPLIFIED_DEDUCTION = 607.20;

  // Progressive tax brackets (2025/2026 base table)
  private static readonly TAX_BRACKETS: TaxBracket[] = [
    { maxIncome: 2428.81, rate: 0.075, deduction: 182.16 },
    { maxIncome: 2826.66, rate: 0.15, deduction: 394.16 },
    { maxIncome: 3751.05, rate: 0.225, deduction: 675.49 },
    { maxIncome: Infinity, rate: 0.275, deduction: 908.73 }
  ];

  constructor(year: number = 2026) {
    this.year = year;
  }

  /**
   * Calculate tax based on liquid income and number of dependents
   *
   * @param liquidIncome - Income after expenses
   * @param dependents - Number of dependents
   * @returns Tax calculation breakdown
   */
  calculateTax(liquidIncome: number, dependents: number) {
    // Step 1: Calculate deduction (use greater of dependent or simplified)
    const dependentDeduction = dependents * BrazilianRentalTaxCalculator.DEPENDENT_DEDUCTION;
    const simplifiedDeduction = BrazilianRentalTaxCalculator.SIMPLIFIED_DEDUCTION;
    const deduction = Math.max(dependentDeduction, simplifiedDeduction);

    // Step 2: Calculate taxable income
    const taxableIncome = Math.max(liquidIncome - deduction, 0);

    // Step 3: Find applicable tax bracket and calculate base tax
    const bracket = this.findTaxBracket(taxableIncome);
    const taxBefore2026Reduction = Math.max(
      taxableIncome * bracket.rate - bracket.deduction,
      0
    );
    let taxReduction2026 = 0;

    // Step 4: Apply 2026+ Reducer if applicable
    if (this.year >= 2026) {
      const reducer = this.calculate2026Reducer(liquidIncome);
      taxReduction2026 = Math.min(reducer, taxBefore2026Reduction);
    }
    const taxOwed = taxBefore2026Reduction - taxReduction2026;

    return {
      deduction,
      taxableIncome,
      taxRate: bracket.rate,
      taxBefore2026Reduction: Math.round(taxBefore2026Reduction * 100) / 100,
      taxReduction2026: Math.round(taxReduction2026 * 100) / 100,
      taxOwed: Math.round(taxOwed * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Calculate the 2026 tax reducer
   * - Up to R$ 5,000: Total exemption (max reducer)
   * - R$ 5,000.01 to R$ 7,350: Partial reduction (formula)
   * - Above R$ 7,350.01: No additional reduction
   */
  private calculate2026Reducer(liquidIncome: number): number {
    if (liquidIncome <= 5000) {
      // Up to 5000, the reducer is meant to zero out the tax.
      // We can return a value large enough, or specifically 312.89 (max reducer for 5k)
      return 312.89;
    } else if (liquidIncome <= 7350) {
      // R$ 978.62 – (0.133145 × liquidIncome)
      return 978.62 - (0.133145 * liquidIncome);
    }
    return 0;
  }

  /**
   * Find the appropriate tax bracket for the given taxable income
   */
  private findTaxBracket(taxableIncome: number): TaxBracket {
    return BrazilianRentalTaxCalculator.TAX_BRACKETS.find(
      bracket => taxableIncome <= bracket.maxIncome
    ) || BrazilianRentalTaxCalculator.TAX_BRACKETS[BrazilianRentalTaxCalculator.TAX_BRACKETS.length - 1];
  }

  /**
   * Get tax bracket information for display purposes
   */
  static getTaxBrackets(): TaxBracket[] {
    return [...this.TAX_BRACKETS.slice(0, -1)]; // Exclude the infinity bracket for display
  }

  /**
   * Get deduction constants
   */
  static getDeductionConstants() {
    return {
      dependentDeduction: this.DEPENDENT_DEDUCTION,
      simplifiedDeduction: this.SIMPLIFIED_DEDUCTION,
    };
  }
}

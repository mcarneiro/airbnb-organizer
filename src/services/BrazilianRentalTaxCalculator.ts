import { TaxCalculator, TaxBracket } from '../types';

/**
 * Brazilian Rental Income Tax Calculator (2025)
 *
 * Implements the Strategy Pattern for tax calculations
 * Following Brazilian tax rules for rental income
 */
export class BrazilianRentalTaxCalculator implements TaxCalculator {
  // Tax constants for 2025
  private static readonly DEPENDENT_DEDUCTION = 189.59;
  private static readonly SIMPLIFIED_DEDUCTION = 607.20;

  // Progressive tax brackets
  private static readonly TAX_BRACKETS: TaxBracket[] = [
    { maxIncome: 2428.81, rate: 0, deduction: 182.16 },
    { maxIncome: 2826.66, rate: 0.075, deduction: 182.16 },
    { maxIncome: 3751.05, rate: 0.15, deduction: 394.16 },
    { maxIncome: 4664.68, rate: 0.225, deduction: 675.49 },
    { maxIncome: Infinity, rate: 0.275, deduction: 908.73 }
  ];

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

    // Step 3: Find applicable tax bracket and calculate tax
    const bracket = this.findTaxBracket(taxableIncome);
    const taxBeforeFloor = taxableIncome * bracket.rate - bracket.deduction;
    const taxOwed = Math.max(taxBeforeFloor, 0); // Ensure tax is not negative

    return {
      deduction,
      taxableIncome,
      taxRate: bracket.rate,
      taxOwed: Math.round(taxOwed * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Find the appropriate tax bracket for the given taxable income
   */
  private findTaxBracket(taxableIncome: number): TaxBracket {
    return BrazilianRentalTaxCalculator.TAX_BRACKETS.find(
      bracket => taxableIncome < bracket.maxIncome
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

import { SHEET_CONFIGS } from '../config/google';
import { Reservation, Expense, AppSettings } from '../types';

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  /**
   * Set access token for API requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Make a request to Google Sheets API
   */
  private async apiRequest(url: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available. Please sign in.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle authentication errors (expired or invalid token)
      if (response.status === 401) {
        // Clear the invalid token
        this.accessToken = null;
        const error = new Error('Your session has expired. Please sign in again.');
        (error as any).code = 'TOKEN_EXPIRED';
        throw error;
      }

      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
  }

  /**
   * Check if a sheet exists
   */
  private async sheetExists(spreadsheetId: string, sheetName: string): Promise<boolean> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const data = await this.apiRequest(url);

      const sheets = data.sheets || [];
      return sheets.some((sheet: any) => sheet.properties?.title === sheetName);
    } catch (error) {
      console.error(`Error checking if sheet exists:`, error);
      return false;
    }
  }

  /**
   * Create a new sheet
   */
  private async createSheet(spreadsheetId: string, sheetName: string): Promise<void> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await this.apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      }),
    });
  }

  /**
   * Write headers to a sheet
   */
  private async writeHeaders(
    spreadsheetId: string,
    sheetName: string,
    columns: string[]
  ): Promise<void> {
    const range = `${sheetName}!A1:${String.fromCharCode(64 + columns.length)}1`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

    await this.apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({
        values: [columns],
      }),
    });
  }

  /**
   * Check if sheet has data (excluding header row)
   */
  private async sheetHasData(spreadsheetId: string, sheetName: string): Promise<boolean> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2:Z`;
      const data = await this.apiRequest(url);
      return (data.values && data.values.length > 0) || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize all required sheets
   */
  async initializeSheets(spreadsheetId: string): Promise<void> {
    for (const [key, config] of Object.entries(SHEET_CONFIGS)) {
      const exists = await this.sheetExists(spreadsheetId, config.name);

      if (!exists) {
        await this.createSheet(spreadsheetId, config.name);
        await this.writeHeaders(spreadsheetId, config.name, config.columns);

        // Write default data for settings sheet (only if sheet is empty)
        if (key === 'settings' && 'defaultData' in config) {
          const hasData = await this.sheetHasData(spreadsheetId, config.name);
          if (!hasData) {
            // Use USER_ENTERED to store numbers as Number values
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.name}!A2?valueInputOption=USER_ENTERED`;
            await this.apiRequest(url, {
              method: 'PUT',
              body: JSON.stringify({
                values: config.defaultData,
              }),
            });
          }
        }
      }
    }
  }

  /**
   * Read settings from sheet
   */
  async readSettings(spreadsheetId: string): Promise<AppSettings> {
    // Use valueRenderOption=UNFORMATTED_VALUE to get actual numbers instead of locale-formatted strings
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/settings!A2:B?valueRenderOption=UNFORMATTED_VALUE`;
    const data = await this.apiRequest(url);

    const rows = data.values || [];
    const settings: any = {
      dependents: 0,
      ownerSplit: 0.7,
      adminSplit: 0.3,
    };

    rows.forEach((row: any[]) => {
      const [key, value] = row;
      switch (key) {
        case 'dependents':
          settings.dependents = parseInt(value) || 0;
          break;
        case 'owner_split':
          settings.ownerSplit = parseFloat(value) || 0.7;
          break;
        case 'admin_split':
          settings.adminSplit = parseFloat(value) || 0.3;
          break;
      }
    });

    return settings;
  }

  /**
   * Write settings to sheet
   */
  async writeSettings(spreadsheetId: string, settings: AppSettings): Promise<void> {
    // Use USER_ENTERED to store numbers as Number values
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/settings!A2:B4?valueInputOption=USER_ENTERED`;
    await this.apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({
        values: [
          ['dependents', settings.dependents.toString()],
          ['owner_split', settings.ownerSplit.toString()],
          ['admin_split', settings.adminSplit.toString()],
        ],
      }),
    });
  }

  /**
   * Parse date string as local date (avoids timezone issues)
   */
  private parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  /**
   * Convert Excel serial date number to Date object
   * Excel dates are stored as days since December 30, 1899
   */
  private excelSerialToDate(serial: number): Date {
    // Excel epoch: December 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    return date;
  }

  /**
   * Parse a date value that could be:
   * - A string in YYYY-MM-DD format
   * - An Excel serial number
   * - A Date object
   */
  private parseDateValue(value: any): Date | null {
    if (!value) return null;

    // If it's already a Date object, return it
    if (value instanceof Date) return value;

    // If it's a number, treat it as Excel serial date
    if (typeof value === 'number') {
      return this.excelSerialToDate(value);
    }

    // If it's a string, check format
    const str = String(value);

    // Check if it's a valid YYYY-MM-DD format
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return this.parseLocalDate(str);
    }

    // If it's a numeric string (Excel serial as string), parse as number
    const asNumber = parseFloat(str);
    if (!isNaN(asNumber) && asNumber > 0) {
      return this.excelSerialToDate(asNumber);
    }

    return null;
  }

  /**
   * Read reservations from sheet
   */
  async readReservations(spreadsheetId: string): Promise<Reservation[]> {
    // Use valueRenderOption=UNFORMATTED_VALUE to get actual numbers instead of locale-formatted strings
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb!A2:E?valueRenderOption=UNFORMATTED_VALUE`;
    const data = await this.apiRequest(url);

    const rows = data.values || [];
    return rows
      .map((row: any[], index: number) => {
        const date = this.parseDateValue(row[0]);
        if (!date) return null; // Skip invalid dates

        return {
          id: `reservation-${index}`,
          date,
          nights: parseInt(row[1]) || 0,
          total: parseFloat(row[2]) || 0,
          ownerAmount: parseFloat(row[3]) || 0,
          adminFee: parseFloat(row[4]) || 0,
        };
      })
      .filter((item: any): item is Reservation => item !== null);
  }

  /**
   * Write reservations to sheet
   */
  async writeReservations(spreadsheetId: string, reservations: Reservation[]): Promise<void> {
    const values = reservations.map((r) => [
      r.date.toISOString().split('T')[0],
      r.nights,
      r.total,
      r.ownerAmount,
      r.adminFee,
    ]);

    // Clear existing data first
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb!A2:E:clear`;
    await this.apiRequest(clearUrl, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Write new data
    if (values.length > 0) {
      // Use USER_ENTERED to store dates as actual Date values and numbers as Number values
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb!A2?valueInputOption=USER_ENTERED`;
      await this.apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          values,
        }),
      });
    }
  }

  /**
   * Read expenses from sheet
   */
  async readExpenses(spreadsheetId: string): Promise<Expense[]> {
    // Use valueRenderOption=UNFORMATTED_VALUE to get actual numbers instead of locale-formatted strings
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb_expenses!A2:D?valueRenderOption=UNFORMATTED_VALUE`;
    const data = await this.apiRequest(url);

    const rows = data.values || [];
    return rows
      .map((row: any[], index: number) => {
        const date = this.parseDateValue(row[0]);
        if (!date) return null; // Skip invalid dates

        return {
          id: `expense-${index}`,
          date,
          amount: parseFloat(row[1]) || 0,
          category: row[2] as any,
          notes: row[3],
        };
      })
      .filter((item: any): item is Expense => item !== null);
  }

  /**
   * Write expenses to sheet
   */
  async writeExpenses(spreadsheetId: string, expenses: Expense[]): Promise<void> {
    const values = expenses.map((e) => [
      e.date.toISOString().split('T')[0],
      e.amount,
      e.category,
      e.notes || '',
    ]);

    // Clear existing data first
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb_expenses!A2:D:clear`;
    await this.apiRequest(clearUrl, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Write new data
    if (values.length > 0) {
      // Use USER_ENTERED to store dates as actual Date values and numbers as Number values
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb_expenses!A2?valueInputOption=USER_ENTERED`;
      await this.apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          values,
        }),
      });
    }
  }

  /**
   * Read paid tax months from sheet
   */
  async readPaidTaxMonths(spreadsheetId: string): Promise<string[]> {
    // Use valueRenderOption=UNFORMATTED_VALUE to get actual values
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/taxes!A2:G?valueRenderOption=UNFORMATTED_VALUE`;
    const data = await this.apiRequest(url);

    const rows = data.values || [];
    const paidMonths: string[] = [];

    console.log(`Reading ${rows.length} rows from taxes sheet`);

    rows.forEach((row: any[], index: number) => {
      const month = row[0]; // date column (YYYY-MM format)
      const isPaid = row[6]; // is_paid column

      console.log(`Row ${index}: month=${month} (type: ${typeof month}), isPaid=${isPaid} (type: ${typeof isPaid}), full row:`, row);

      // Convert month value to YYYY-MM format
      let monthStr = '';

      if (typeof month === 'number') {
        // It's an Excel serial number - convert to date and format as YYYY-MM
        const date = this.excelSerialToDate(month);
        const year = date.getFullYear();
        const monthNum = String(date.getMonth() + 1).padStart(2, '0');
        monthStr = `${year}-${monthNum}`;
        console.log(`  -> Converted Excel serial ${month} to ${monthStr}`);
      } else if (typeof month === 'string') {
        monthStr = month;
      } else {
        console.log(`  -> Month is invalid type, skipping`);
        return;
      }

      // Check if month is valid format
      if (!monthStr || !monthStr.match(/^\d{4}-\d{2}$/)) {
        console.log(`  -> Month "${monthStr}" doesn't match YYYY-MM format, skipping`);
        return;
      }

      // Check if it's paid - handle multiple formats
      // Could be: boolean true, string 'TRUE', string 'true', number 1, string '1'
      const isPaidValue = isPaid === true ||
                          isPaid === 'TRUE' ||
                          isPaid === 'true' ||
                          isPaid === 1 ||
                          isPaid === '1' ||
                          String(isPaid).toUpperCase() === 'TRUE';

      console.log(`  -> Month "${monthStr}" format OK, isPaid=${isPaidValue}`);

      if (isPaidValue) {
        paidMonths.push(monthStr);
        console.log(`  -> Added ${monthStr} to paid months`);
      }
    });

    console.log(`Total paid months found: ${paidMonths.length}`, paidMonths);

    return paidMonths;
  }

  /**
   * Write tax data to sheet
   */
  async writeTaxData(
    spreadsheetId: string,
    taxData: Array<{
      month: string;
      income: number;
      deductions: number;
      taxRate: number;
      taxOwed: number;
      profit: number;
      isPaid: boolean;
    }>
  ): Promise<void> {
    const values = taxData.map((t) => [
      t.month, // date (YYYY-MM format) - will be interpreted as date by Google Sheets
      t.income,
      t.deductions,
      t.taxRate,
      t.taxOwed,
      t.profit,
      t.isPaid, // Use boolean directly - USER_ENTERED will interpret it correctly
    ]);

    // Clear existing data first
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/taxes!A2:G:clear`;
    await this.apiRequest(clearUrl, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Write new data
    if (values.length > 0) {
      // Use USER_ENTERED to store numbers as Number values
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/taxes!A2?valueInputOption=USER_ENTERED`;
      await this.apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          values,
        }),
      });
    }
  }

  /**
   * Extract spreadsheet ID from URL
   */
  static extractSpreadsheetId(url: string): string | null {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}

export const googleSheetsService = GoogleSheetsService.getInstance();

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
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.name}!A2?valueInputOption=RAW`;
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/settings!A2:B`;
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/settings!A2:B4?valueInputOption=RAW`;
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
   * Read reservations from sheet
   */
  async readReservations(spreadsheetId: string): Promise<Reservation[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb!A2:E`;
    const data = await this.apiRequest(url);

    const rows = data.values || [];
    return rows.map((row: any[], index: number) => ({
      id: `reservation-${index}`,
      date: this.parseLocalDate(row[0]),
      nights: parseInt(row[1]) || 0,
      total: parseFloat(row[2]) || 0,
      ownerAmount: parseFloat(row[3]) || 0,
      adminFee: parseFloat(row[4]) || 0,
    }));
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
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb!A2?valueInputOption=RAW`;
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb_expenses!A2:D`;
    const data = await this.apiRequest(url);

    const rows = data.values || [];
    return rows.map((row: any[], index: number) => ({
      id: `expense-${index}`,
      date: this.parseLocalDate(row[0]),
      amount: parseFloat(row[1]) || 0,
      category: row[2] as any,
      notes: row[3],
    }));
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
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/airbnb_expenses!A2?valueInputOption=RAW`;
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

import { Injectable } from '@angular/core';

export interface CsvColumn<T> {
  header: string;
  key?: keyof T;
  transform?: (row: T) => string | number | null | undefined;
}

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  /**
   * Generates and downloads a CSV file formatted for Excel with UTF-8 BOM.
   */
  exportToCsv<T>(data: T[], columns: CsvColumn<T>[], filename: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const headers = columns.map((col) => this.escapeCsv(col.header)).join(';');
    const rows = data.map((row) =>
      columns
        .map((col) => {
          let val: unknown;
          if (col.transform) {
            val = col.transform(row);
          } else if (col.key) {
            val = row[col.key];
          }
          return this.escapeCsv(val == null ? '' : String(val));
        })
        .join(';'),
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/\.csv$/i, '')}_${this.timestamp()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    const stringValue = String(value);
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private timestamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

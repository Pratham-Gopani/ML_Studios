import Papa from 'papaparse';

export function parseCSV(file: File): Promise<{ data: Record<string, any>[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, any>[];
        const columns = results.meta.fields || [];
        resolve({ data, columns });
      },
      error: (error) => reject(error)
    });
  });
}

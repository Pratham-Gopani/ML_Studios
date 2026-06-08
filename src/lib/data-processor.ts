import { DatasetSnapshot, PreprocessingConfig } from '../types';

export function detectColumnTypes(data: any[], columns: string[]): Record<string, 'numeric' | 'categorical' | 'datetime'> {
  const types: Record<string, 'numeric' | 'categorical' | 'datetime'> = {};

  columns.forEach((col) => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) {
      types[col] = 'categorical';
      return;
    }

    const numericCount = values.filter(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== '')).length;
    if (numericCount / values.length > 0.8) {
      const uniqueNumeric = new Set(values.map(v => Number(v))).size;
      if (uniqueNumeric < 10 && values.length > 100) {
        types[col] = 'categorical';
      } else {
        types[col] = 'numeric';
      }
      return;
    }

    const sample = values.find(v => typeof v === 'string' && v.length > 0);
    if (sample && !isNaN(Date.parse(sample)) && sample.length > 5) {
      types[col] = 'datetime';
    } else {
      types[col] = 'categorical';
    }
  });

  return types;
}

export function getSummaryStats(data: any[], columns: string[]): Record<string, any> {
  const stats: Record<string, any> = {};
  columns.forEach(col => {
    const values = data.map(row => row[col]);
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    
    if (numericValues.length === 0) {
      // Categorical column: return mode and unique count
      const mode = values.sort((a,b) =>
        values.filter(v => v === a).length - values.filter(v => v === b).length
      ).pop();
      stats[col] = {
        type: 'categorical',
        unique: new Set(values).size,
        mode
      };
    } else {
      // Numeric column
      const mean = numericValues.reduce((a,b) => a + b, 0) / numericValues.length;
      const sorted = [...numericValues].sort((a,b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const stdDev = Math.sqrt(
        numericValues.map(x => Math.pow(x - mean, 2)).reduce((a,b) => a + b, 0) / numericValues.length
      );
      stats[col] = {
        type: 'numeric',
        mean,
        median,
        stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1]
      };
    }
  });
  return stats;
}
function getMode(values: any[]): any {
  if (values.length === 0) return null;
  const counts = new Map<any, number>();
  let mode = values[0], maxCount = 0;
  for (const val of values) {
    if (val === null || val === undefined) continue;
    const count = (counts.get(val) || 0) + 1;
    counts.set(val, count);
    if (count > maxCount) { maxCount = count; mode = val; }
  }
  return mode;
}

export function applyPreprocessing(data: any[], columns: string[], config: PreprocessingConfig): any[] {
  let cols = (config.selectedFeatures && config.selectedFeatures.length > 0) ? [...config.selectedFeatures] : [...columns];
  if (config.targetVariable && !cols.includes(config.targetVariable)) {
    cols.push(config.targetVariable);
  }
  cols = cols.filter(c => columns.includes(c));

  let processed = data.map(row => {
    const newRow: any = {};
    cols.forEach(col => { newRow[col] = row[col]; });
    return newRow;
  });

  // Handle missing values
  cols.forEach(col => {
    const values = processed.map(row => row[col]);
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    const hasMissing = values.some(v => v === null || v === undefined || v === '');

    if (!hasMissing) return;

    if (config.missingValueStrategy === 'drop') {
      processed = processed.filter(row => row[col] !== null && row[col] !== undefined && row[col] !== '');
    } else {
      let fillVal: any;
      if (numericValues.length > 0) {
        if (config.missingValueStrategy === 'mean') {
          fillVal = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        } else if (config.missingValueStrategy === 'median') {
          const sorted = [...numericValues].sort((a, b) => a - b);
          fillVal = sorted[Math.floor(sorted.length / 2)];
        } else {
          fillVal = getMode(numericValues);
        }
      } else {
        fillVal = getMode(values.filter(v => v !== null && v !== undefined && v !== ''));
      }
      processed = processed.map(row => ({
        ...row,
        [col]: (row[col] === null || row[col] === undefined || row[col] === '') ? fillVal : row[col]
      }));
    }
  });

  // Label encode categorical columns
  cols.forEach(col => {
    const values = processed.map(row => row[col]);
    if (values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))) return;
    const uniqueVals = [...new Set(values.filter(v => v !== null && v !== undefined))];
    const labelMap: Record<string, number> = {};
    uniqueVals.forEach((v, i) => { labelMap[String(v)] = i; });
    processed = processed.map(row => ({
      ...row,
      [col]: labelMap[String(row[col])] ?? 0
    }));
  });

  // Convert all values to numbers first to ensure they are float64 for scaling math
  processed = processed.map(row => {
    const newRow: any = {};
    cols.forEach(col => { newRow[col] = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0; });
    return newRow;
  });

  // Feature Scaling
  if (config.scaling && config.scaling !== 'none') {
    cols.forEach(col => {
      // Do not scale the target variable
      if (col === config.targetVariable) return;

      const values = processed.map(row => Number(row[col]) || 0);
      if (values.length === 0) return;

      if (config.scaling === 'standard') {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        processed = processed.map(row => ({
          ...row,
          [col]: (Number(row[col]) - mean) / (stdDev || 1)
        }));
      } else if (config.scaling === 'minmax') {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        processed = processed.map(row => ({
          ...row,
          [col]: range > 0 ? (Number(row[col]) - min) / range : 0
        }));
      }
    });
  }

  return processed;
}

export function splitData(data: any[], ratio: number, seed: number): [any[], any[]] {
  const total = data.length;
  const trainSize = Math.floor(total * ratio);
  const indices = Array.from({ length: total }, (_, i) => i);

  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  let currentIndex = indices.length;
  for (let i = 0; i < indices.length; i++) {
    const randomIndex = Math.floor(seededRandom(seed + i) * currentIndex);
    currentIndex--;
    [indices[currentIndex], indices[randomIndex]] = [indices[randomIndex], indices[currentIndex]];
  }

  const trainIndices = indices.slice(0, trainSize);
  const testIndices = indices.slice(trainSize);
  return [trainIndices.map(i => data[i]), testIndices.map(i => data[i])];
}

function getMissingValues(data: any[], columns: string[]): Record<string, number> {
  const missing: Record<string, number> = {};
  columns.forEach(col => {
    missing[col] = data.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
  });
  return missing;
}

export function createSnapshot(data: any[], name: string): DatasetSnapshot {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  return {
    id: crypto.randomUUID(),
    name,
    data,
    columns,
    columnTypes: detectColumnTypes(data, columns),
    shape: [data.length, columns.length],
    missingValues: getMissingValues(data, columns),
    summaryStats: getSummaryStats(data, columns),
    timestamp: new Date().toISOString()
  };
}

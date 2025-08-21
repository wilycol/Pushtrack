import { ReportHistoryEntry } from '../../types';

const HISTORY_DB_KEY = 'pushtrack_reportsHistory';
const RETENTION_DAYS = 60;

export const getHistory = (): ReportHistoryEntry[] => {
  try {
    const rawData = localStorage.getItem(HISTORY_DB_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error("Failed to retrieve report history:", error);
    return [];
  }
};

const saveHistory = (history: ReportHistoryEntry[]): void => {
  try {
    localStorage.setItem(HISTORY_DB_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save report history:", error);
  }
};

const applyRetentionPolicy = (history: ReportHistoryEntry[]): ReportHistoryEntry[] => {
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - RETENTION_DAYS);
    return history.filter(entry => new Date(entry.when) >= retentionCutoff);
};

export const addHistoryEntry = (newEntry: ReportHistoryEntry): void => {
  let history = getHistory();
  history.unshift(newEntry); // Add to the beginning
  history = applyRetentionPolicy(history);
  saveHistory(history);
};

export const clearHistory = (): void => {
  saveHistory([]);
};

import { utils, writeFile, write } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TFunction } from 'i18next';
import { ReportDefinition, ReportFilter } from '../../types';
import { addHistoryEntry } from './reportHistory';

type ReportData = { label: string; value: number | string }[] | { title: string; value: number | string }[];

const getFormattedTimestamp = () => {
    const d = new Date();
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${YYYY}${MM}${DD}_${HH}${mm}`;
};

const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

const generateFilename = (reportName: string, extension: string) => {
    return `Pushtrack_Reporte_${sanitizeFilename(reportName)}_${getFormattedTimestamp()}.${extension}`;
};

const normalizeData = (data: ReportData): { metric: string; value: number | string }[] => {
    if (data.length === 0) return [];
    if ('label' in data[0]) {
        return (data as { label: string; value: number }[]).map(item => ({ metric: item.label, value: item.value }));
    }
    if ('title' in data[0]) {
        return (data as { title: string; value: string | number }[]).map(item => ({ metric: item.title, value: item.value }));
    }
    return [];
};

const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const exportToCSV = async (report: ReportDefinition, data: ReportData, t: TFunction, filters: ReportFilter, triggeredBy: 'manual' | 'scheduled') => {
    const normalizedData = normalizeData(data);
    const headers = [t('reports.export.headers.metric'), t('reports.export.headers.value')];
    const csvContent = [
        headers.join(','),
        ...normalizedData.map(row => `"${String(row.metric).replace(/"/g, '""')}","${String(row.value).replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = generateFilename(report.name, 'csv');
    const base64Content = await blobToBase64(blob);

    addHistoryEntry({
        id: `run-${crypto.randomUUID()}`,
        reportId: report.id,
        reportName: report.name,
        when: new Date().toISOString(),
        filters,
        format: 'csv',
        status: 'completed',
        fileName: filename,
        triggeredBy,
        fileContentBase64: base64Content,
        mimeType: 'text/csv;charset=utf-8;',
    });

    if (triggeredBy === 'manual') {
      triggerDownload(blob, filename);
    }
};

export const exportToJSON = async (report: ReportDefinition, data: ReportData, filters: ReportFilter, triggeredBy: 'manual' | 'scheduled') => {
    const normalizedData = normalizeData(data);
    const jsonContent = JSON.stringify({
        reportName: report.name,
        exportedAt: new Date().toISOString(),
        filters,
        data: normalizedData,
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const filename = generateFilename(report.name, 'json');
    const base64Content = await blobToBase64(blob);

    addHistoryEntry({
        id: `run-${crypto.randomUUID()}`,
        reportId: report.id,
        reportName: report.name,
        when: new Date().toISOString(),
        filters,
        format: 'json',
        status: 'completed',
        fileName: filename,
        triggeredBy,
        fileContentBase64: base64Content,
        mimeType: 'application/json;charset=utf-8;',
    });

    if (triggeredBy === 'manual') {
        triggerDownload(blob, filename);
    }
};


export const exportToXLSX = async (report: ReportDefinition, data: ReportData, t: TFunction, filters: ReportFilter, triggeredBy: 'manual' | 'scheduled') => {
    const normalizedData = normalizeData(data);
    const worksheet = utils.json_to_sheet(normalizedData, {
        header: ['metric', 'value']
    });
    utils.sheet_add_aoa(worksheet, [[t('reports.export.headers.metric'), t('reports.export.headers.value')]], { origin: 'A1' });
    
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Report Data');
    
    const wbout = write(workbook, { bookType:'xlsx', type:'array' });
    const blob = new Blob([wbout], {type:"application/octet-stream"});
    const filename = generateFilename(report.name, 'xlsx');
    const base64Content = await blobToBase64(blob);

    addHistoryEntry({
        id: `run-${crypto.randomUUID()}`,
        reportId: report.id,
        reportName: report.name,
        when: new Date().toISOString(),
        filters,
        format: 'xlsx',
        status: 'completed',
        fileName: filename,
        triggeredBy,
        fileContentBase64: base64Content,
        mimeType: 'application/octet-stream',
    });

    if (triggeredBy === 'manual') {
        triggerDownload(blob, filename);
    }
};


export const exportToPDF = async (report: ReportDefinition, reportCardElement: HTMLElement | null, filters: ReportFilter, triggeredBy: 'manual' | 'scheduled') => {
    if (!reportCardElement) return;

    const canvas = await html2canvas(reportCardElement, {
        backgroundColor: '#111213',
        scale: 2,
        useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const blob = pdf.output('blob');
    const filename = generateFilename(report.name, 'pdf');
    const base64Content = await blobToBase64(blob);

    addHistoryEntry({
        id: `run-${crypto.randomUUID()}`,
        reportId: report.id,
        reportName: report.name,
        when: new Date().toISOString(),
        filters,
        format: 'pdf',
        status: 'completed',
        fileName: filename,
        triggeredBy,
        fileContentBase64: base64Content,
        mimeType: 'application/pdf',
    });

    if (triggeredBy === 'manual') {
        triggerDownload(blob, filename);
    }
};

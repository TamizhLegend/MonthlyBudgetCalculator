import React, { useRef, useState } from 'react';
import { MonthExpenseData } from '../types';
import { downloadMonthJsonFile, downloadAllDataBackup } from '../services/storageService';
import { formatCurrency } from '../utils/formatCurrency';
import { 
  FileJson, Download, Upload, CheckCircle2, AlertCircle, 
  Copy, Check, FileText 
} from 'lucide-react';

interface JsonHubViewProps {
  monthsData: MonthExpenseData[];
  onImportData: (imported: MonthExpenseData) => void;
  onImportAllBackup: (importedAll: MonthExpenseData[]) => void;
}

export const JsonHubView: React.FC<JsonHubViewProps> = ({
  monthsData,
  onImportData,
  onImportAllBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonthId, setSelectedMonthId] = useState<string>(
    monthsData[0]?.id || ''
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedMonthData = monthsData.find((m) => m.id === selectedMonthId) || monthsData[0];

  const handleCopyJson = () => {
    if (!selectedMonthData) return;
    navigator.clipboard.writeText(JSON.stringify(selectedMonthData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        // Check if single month format
        if (parsed && parsed.monthName && parsed.year && Array.isArray(parsed.items)) {
          onImportData(parsed as MonthExpenseData);
          setFeedback({
            type: 'success',
            message: `Successfully loaded ${parsed.monthName}_${parsed.year}.json!`,
          });
          setSelectedMonthId(parsed.id || `${parsed.year}-${String(parsed.month).padStart(2, '0')}`);
        } else if (Array.isArray(parsed)) {
          // Backup list
          onImportAllBackup(parsed);
          setFeedback({
            type: 'success',
            message: `Successfully imported backup with ${parsed.length} months!`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: 'Invalid JSON structure. Ensure it is either a Month_Year.json or an Expense Backup array.',
          });
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          message: 'Error reading JSON file. Please ensure the file contains valid JSON.',
        });
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Header banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileJson className="h-6 w-6 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              JSON File Center & Data Portability
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every month can be saved and downloaded as a standalone <code className="bg-slate-100 text-brand-700 px-1.5 py-0.5 rounded font-mono text-xs">Month_Year.json</code> file.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Hidden File Input */}
          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
          >
            <Upload className="h-4 w-4" />
            <span>Upload JSON File</span>
          </button>

          <button
            onClick={() => downloadAllDataBackup(monthsData)}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Master Backup</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Month selector list */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 px-2">
            Available Month Files ({monthsData.length})
          </h3>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {monthsData.map((m) => {
              const isSelected = selectedMonthData?.id === m.id;
              const total = m.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMonthId(m.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-50/80 border-brand-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/70'
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {m.monthName}_{m.year}.json
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {m.items.length} items &bull; {formatCurrency(total)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMonthJsonFile(m);
                    }}
                    title="Download this JSON"
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: JSON Preview & Actions */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  JSON Preview: <span className="font-mono text-sm text-brand-700">{selectedMonthData ? `${selectedMonthData.monthName}_${selectedMonthData.year}.json` : 'None'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Standard structured schema compatible with automated imports and offline backups.
                </p>
              </div>

              {selectedMonthData && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center space-x-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => downloadMonthJsonFile(selectedMonthData)}
                    className="flex items-center space-x-1 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>

            {/* Code Block Container */}
            <div className="mt-4 bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-[420px] text-slate-200 font-mono text-xs shadow-inner">
              <pre>
                {selectedMonthData
                  ? JSON.stringify(selectedMonthData, null, 2)
                  : '// Select or create a month to view its JSON payload'}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Storage: Locally cached on your browser & easily exported as standalone JSON.</span>
            <span className="font-semibold text-slate-700">Schema Version: 1.0</span>
          </div>
        </div>

      </div>

    </div>
  );
};

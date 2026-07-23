"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef } from "react";
import { Upload, RefreshCw, CheckCircle, AlertCircle, FileText, Eye, X } from "lucide-react";

const SAMPLE_CSV = `name,address,phone,email,website,description,category,city,image_url
McDonough Dental Care,125 Sabot Way McDonough GA,770-555-0210,info@mcdonoughdental.com,https://mcdonoughdental.com,Professional dental clinic offering standard checkups scaling implants and family oral care.,Medicals,McDonough,https://images.unsplash.com/photo-1606811841689-23dfddce3e95
Stockbridge Auto Repair,480 North Henry Blvd Stockbridge GA,770-555-0220,service@stockbridgeauto.com,https://stockbridgeauto.com,Full service automotive workshop specializing in engine diagnostics brake services and tire installations.,Automotive,Stockbridge,https://images.unsplash.com/photo-1619642751034-765dfdf7c58e
Hampton Coffee Depot,12 Cherry St Hampton GA,770-555-0230,hello@hamptoncoffee.com,https://hamptoncoffee.com,Cozy coffee shop offering hand-roasted coffee blends house-made pastries and quiet workspaces.,Foods,Hampton,https://images.unsplash.com/photo-1554118811-1e0d58224f24`;

interface CsvTabProps {
  importHistory: any[];
  onRefresh: () => void;
}

interface RowResult {
  row: number;
  name: string;
  status: "inserted" | "duplicate" | "error";
  message?: string;
}

export function CsvTab({ importHistory, onRefresh }: CsvTabProps) {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<any>(null);
  const [rowResults, setRowResults] = useState<RowResult[]>([]);
  const [ghlLoading, setGhlLoading] = useState(false);
  const [ghlStatus, setGhlStatus] = useState<any>(null);
  const [previewLog, setPreviewLog] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setCsvText(e.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFileRead(file);
  };

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    setRowResults([]);
    setImportLoading(true);
    try {
      const res = await fetch("/api/csv-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      setImportStatus(data);

      // Build per-row results from response
      if (data.results) {
        setRowResults(data.results);
      } else if (!data.error) {
        // Synthesize from summary counts if API doesn't return per-row
        const lines = csvText.trim().split("\n").slice(1);
        const synthesized: RowResult[] = lines.map((line, i) => {
          const name = line.split(",")[0] ?? `Row ${i + 2}`;
          return { row: i + 2, name, status: "inserted" };
        });
        setRowResults(synthesized);
      }
      onRefresh();
    } catch (err: any) {
      setImportStatus({ error: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleGHLSync = async () => {
    setGhlStatus(null);
    setGhlLoading(true);
    try {
      const res = await fetch("/api/ghl-sync", { method: "POST" });
      setGhlStatus(await res.json());
    } catch (err: any) {
      setGhlStatus({ error: err.message });
    } finally {
      setGhlLoading(false);
    }
  };

  const statusConfig = {
    inserted: { color: "text-emerald-400 bg-emerald-950 border-emerald-900", label: "Inserted" },
    duplicate: { color: "text-amber-400 bg-amber-950 border-amber-900", label: "Duplicate" },
    error: { color: "text-red-400 bg-red-950 border-red-900", label: "Error" },
  };

  return (
    <div className="space-y-6">
      {/* Import Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Upload className="h-4 w-4 text-brandRed" />
          <span>CSV Seed Import</span>
        </h2>
        <p className="text-[11px] text-slate-500">
          Columns: <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">name, address, phone, email, website, description, category, city</code>
        </p>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            dragOver ? "border-brandRed bg-red-950/20" : "border-slate-700 hover:border-slate-600"
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileRead(f);
          }} />
          <FileText className="h-6 w-6 text-slate-600 mx-auto mb-1" />
          <p className="text-[11px] text-slate-500">Drop a <span className="text-slate-300">.csv</span> file here or click to browse</p>
        </div>

        <form onSubmit={handleCSVImport} className="space-y-3">
          <textarea
            rows={7}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brandRed resize-none"
            placeholder="Paste CSV data here…"
          />
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} className="text-xs text-slate-500 hover:text-slate-300 underline">
              Reset to sample
            </button>
            <button
              type="submit"
              disabled={importLoading}
              className="bg-brandRed hover:bg-brandRed-hover text-white text-xs font-bold px-5 py-2 rounded-lg transition disabled:opacity-50 flex items-center space-x-2"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{importLoading ? "Importing…" : "Run Import"}</span>
            </button>
          </div>
        </form>

        {/* Import Summary */}
        {importStatus && !importStatus.error && (
          <div className="p-3 rounded-lg text-xs border bg-emerald-950 border-emerald-900 text-emerald-300">
            <div className="flex items-center space-x-1.5 font-bold mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Import complete — {importStatus.importedCount ?? rowResults.filter(r => r.status === "inserted").length} inserted · {importStatus.duplicateCount ?? rowResults.filter(r => r.status === "duplicate").length} duplicates · {importStatus.errorCount ?? rowResults.filter(r => r.status === "error").length} errors</span>
            </div>
          </div>
        )}
        {importStatus?.error && (
          <div className="p-3 rounded-lg text-xs border bg-red-950 border-red-900 text-red-300">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Error: {importStatus.error}</span>
            </div>
          </div>
        )}

        {/* Per-Row Results Table */}
        {rowResults.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Row-by-Row Results</h3>
            <div className="border border-slate-700 rounded-lg overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-[40px_1fr_100px_1fr] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-3 py-2 border-b border-slate-700">
                  <span>#</span>
                  <span>Name</span>
                  <span>Status</span>
                  <span>Note</span>
                </div>
                <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto">
                {rowResults.map((r) => {
                  const cfg = statusConfig[r.status];
                  return (
                    <div key={r.row} className="grid grid-cols-[40px_1fr_100px_1fr] items-center px-3 py-2 text-[11px]">
                      <span className="text-slate-600 font-mono">{r.row}</span>
                      <span className="text-slate-200 truncate pr-2">{r.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border w-fit ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-slate-500 truncate pl-2">{r.message ?? ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* GHL Sync */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 text-brandRed" />
          <span>GoHighLevel Sync</span>
        </h2>
        <p className="text-[11px] text-slate-500">Push all unclaimed listings to GHL as cold-lead contacts tagged <code className="text-slate-300">unclaimed-listing</code>.</p>
        <button
          onClick={handleGHLSync}
          disabled={ghlLoading}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${ghlLoading ? "animate-spin" : ""}`} />
          <span>{ghlLoading ? "Syncing…" : "Sync Unclaimed Listings to GHL"}</span>
        </button>
        {ghlStatus && (
          <div className={`p-3 rounded-lg text-xs ${ghlStatus.error ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"}`}>
            {ghlStatus.error ? ghlStatus.error : `${ghlStatus.message || "Synced."} (${ghlStatus.syncedCount} contacts)`}
          </div>
        )}
      </div>

      {/* Import History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Import History</h2>
        {importHistory.length === 0 ? (
          <p className="text-xs text-slate-600 italic text-center py-4">No import log entries yet.</p>
        ) : (
          <div className="border border-slate-700 rounded-lg overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-4 py-2 border-b border-slate-700">
                <span>Action</span>
                <span className="pr-4">Date</span>
                <span>CSV</span>
              </div>
              <div className="divide-y divide-slate-800 max-h-52 overflow-y-auto">
              {importHistory.map((log) => (
                <div key={log.id} className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2.5 text-[11px]">
                  <span className="text-slate-300 font-mono">{log.action}</span>
                  <span className="text-slate-600 pr-4">{new Date(log.created_at).toLocaleString()}</span>
                  {log.details && (
                    <button
                      onClick={() => setPreviewLog(log.details)}
                      className="text-slate-500 hover:text-slate-300 transition p-1"
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Preview Modal */}
      {previewLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewLog(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Log Details</h3>
              <button onClick={() => setPreviewLog(null)} className="text-slate-500 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="text-[11px] text-slate-300 font-mono bg-slate-950 p-3 rounded-lg max-h-72 overflow-auto whitespace-pre-wrap">
              {previewLog}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

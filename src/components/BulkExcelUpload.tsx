import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, X, CheckCircle2, Download } from "lucide-react";

export type ExcelAccountRow = {
  label: string;
  uid?: string;
  password?: string;
  cookies?: string;
  region?: string;
  user_agent?: string;
};

const COLUMN_ALIASES: Record<keyof ExcelAccountRow, string[]> = {
  label: ["label", "name", "account", "account_name", "id_name"],
  uid: ["uid", "userid", "user_id", "user id", "fb_uid", "id"],
  password: ["password", "pass", "pwd", "fb_password"],
  cookies: ["cookies", "cookie", "fb_cookie", "fb_cookies", "ck"],
  region: ["region", "country", "location"],
  user_agent: ["user_agent", "useragent", "ua"],
};

function pickValue(row: Record<string, any>, aliases: string[]): string | undefined {
  const keys = Object.keys(row).map((k) => ({ raw: k, norm: k.toLowerCase().trim().replace(/[\s-]+/g, "_") }));
  for (const a of aliases) {
    const hit = keys.find((k) => k.norm === a.toLowerCase().replace(/[\s-]+/g, "_"));
    if (hit) {
      const v = row[hit.raw];
      if (v === null || v === undefined || v === "") return undefined;
      return String(v).trim();
    }
  }
  return undefined;
}

export function BulkExcelUpload({
  onImport,
  busy,
  onClose,
}: {
  onImport: (rows: ExcelAccountRow[]) => void;
  busy: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ExcelAccountRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed: ExcelAccountRow[] = [];
      for (let i = 0; i < json.length; i++) {
        const r = json[i];
        const uid = pickValue(r, COLUMN_ALIASES.uid);
        const password = pickValue(r, COLUMN_ALIASES.password);
        const cookies = pickValue(r, COLUMN_ALIASES.cookies);
        const region = pickValue(r, COLUMN_ALIASES.region);
        const user_agent = pickValue(r, COLUMN_ALIASES.user_agent);
        let label = pickValue(r, COLUMN_ALIASES.label);
        if (!label) label = uid || `Account ${i + 1}`;
        if (!cookies && !(uid && password)) continue; // need at least one credential
        parsed.push({ label, uid, password, cookies, region, user_agent });
      }
      if (parsed.length === 0) {
        setError("No valid rows found. Need columns: uid, password, cookies (or any combination).");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch (e: any) {
      setError(e?.message ?? "Failed to parse Excel file");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["label", "uid", "password", "cookies", "region", "user_agent"],
      ["BD-Account-01", "100012345678", "MyPass123!", "c_user=100...; xs=...;", "BD", ""],
      ["BD-Account-02", "100087654321", "Pass456!", "", "BD", ""],
      ["Cookie-Only-03", "", "", "c_user=...; xs=...;", "IN", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FB Accounts");
    XLSX.writeFile(wb, "fb-accounts-template.xlsx");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur p-4">
      <div className="glass-strong w-full max-w-4xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Bulk Upload Excel</h3>
              <p className="text-xs text-muted-foreground">Columns: <span className="font-mono">uid · password · cookies</span> (mix & match)</p>
            </div>
          </div>
          <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Download .xlsx template
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-2 text-xs font-semibold text-slate-900 hover:opacity-90">
            <Upload className="h-3.5 w-3.5" /> Choose Excel / CSV file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {fileName && <span className="self-center text-xs text-muted-foreground">📂 {fileName} · {rows.length} valid rows</span>}
        </div>

        <div className="mb-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 ring-1 ring-emerald-500/30">
          💡 <b>Auto-fallback login:</b> When you press "Login Test" on an account, the app first tries cookies, and if cookies fail, it falls back to UID + Password automatically. New cookies from a successful UID/PASS login are saved for next time.
        </div>

        {error && <div className="mb-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-500/30">⚠️ {error}</div>}

        {rows.length > 0 && (
          <div className="mb-4 overflow-x-auto rounded-2xl ring-1 ring-white/10">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-left uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">UID</th>
                  <th className="px-3 py-2">Password</th>
                  <th className="px-3 py-2">Cookies</th>
                  <th className="px-3 py-2">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => {
                  const hasCk = !!r.cookies;
                  const hasUP = !!(r.uid && r.password);
                  const strat = hasCk && hasUP ? "Cookies → UID/PASS" : hasCk ? "Cookies only" : "UID/PASS only";
                  return (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2 font-mono">{r.uid ?? "—"}</td>
                      <td className="px-3 py-2 font-mono">{r.password ? "•".repeat(Math.min(r.password.length, 8)) : "—"}</td>
                      <td className="px-3 py-2 font-mono">{r.cookies ? `${r.cookies.length} chars` : "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${hasCk && hasUP ? "bg-emerald-500/20 text-emerald-200" : hasCk ? "bg-sky-500/20 text-sky-200" : "bg-amber-500/20 text-amber-200"}`}>
                          {strat}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length > 50 && (
                  <tr className="border-t border-white/5">
                    <td colSpan={6} className="px-3 py-2 text-center text-muted-foreground">… and {rows.length - 50} more</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="glass rounded-xl px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
          <button
            disabled={rows.length === 0 || busy}
            onClick={() => onImport(rows)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40">
            <CheckCircle2 className="h-4 w-4" /> {busy ? "Importing…" : `Import ${rows.length} accounts`}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Code2,
  Plus,
  Trash2,
  Edit,
  Upload,
  Search,
  ChevronDown,
  Save,
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

type Category = "ovu" | "g" | "kk" | "pt";

interface RvpCode {
  id: string;
  code: string;
  description: string;
  grade?: number | null;
}

interface RvpCodelists {
  ovu: RvpCode[];
  g: RvpCode[];
  kk: RvpCode[];
  pt: RvpCode[];
}

const CATEGORIES: { key: Category; label: string; fullLabel: string; color: string; badge: string }[] = [
  { key: "ovu", label: "OVU", fullLabel: "Očekávané výstupy učení", color: "emerald", badge: "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" },
  { key: "g",   label: "G",   fullLabel: "Gramotnosti",             color: "cyan",    badge: "bg-cyan-600/10 border-cyan-500/20 text-cyan-400" },
  { key: "kk",  label: "KK",  fullLabel: "Klíčové kompetence",      color: "amber",   badge: "bg-amber-600/10 border-amber-500/20 text-amber-400" },
  { key: "pt",  label: "PT",  fullLabel: "Průřezová témata",         color: "indigo",  badge: "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" },
];

function parseImportText(text: string, category: Category): { code: string; description: string; grade?: number }[] {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("#"))
    .map(line => {
      // Support both semicolons and tabs as separator
      const sep = line.includes(";") ? ";" : "\t";
      const parts = line.split(sep).map(p => p.trim());
      if (parts.length < 2) return null;
      const [code, description, gradeStr] = parts;
      if (!code || !description) return null;
      const result: { code: string; description: string; grade?: number } = { code, description };
      if (category === "ovu" && gradeStr && !isNaN(parseInt(gradeStr, 10))) {
        result.grade = parseInt(gradeStr, 10);
      }
      return result;
    })
    .filter(Boolean) as { code: string; description: string; grade?: number }[];
}

export default function RvpCodesPage() {
  const [activeTab, setActiveTab] = useState<Category>("ovu");
  const [codes, setCodes] = useState<RvpCodelists>({ ovu: [], g: [], kk: [], pt: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // Add/Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<RvpCode | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formGrade, setFormGrade] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<{ code: string; description: string; grade?: number }[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rvp");
      if (!res.ok) throw new Error("Nelze načíst číselníky");
      const data = await res.json();
      setCodes(data);
    } catch (err: any) {
      toast.error(err.message || "Chyba při načítání RVP číselníků");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // Update import preview when text or active tab changes
  useEffect(() => {
    if (importText.trim()) {
      setImportPreview(parseImportText(importText, activeTab));
    } else {
      setImportPreview([]);
    }
  }, [importText, activeTab]);

  const openAdd = () => {
    setEditingCode(null);
    setFormCode("");
    setFormDesc("");
    setFormGrade("");
    setShowForm(true);
  };

  const openEdit = (c: RvpCode) => {
    setEditingCode(c);
    setFormCode(c.code);
    setFormDesc(c.description);
    setFormGrade(c.grade != null ? String(c.grade) : "");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formDesc.trim()) {
      toast.error("Kód i popis jsou povinné");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        category: activeTab,
        code: formCode.trim(),
        description: formDesc.trim(),
        grade: formGrade || undefined
      };

      if (editingCode) {
        const res = await fetch(`/api/rvp/${editingCode.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Úprava selhala");
        }
        toast.success("Kód byl upraven");
      } else {
        const res = await fetch("/api/rvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Přidání selhalo");
        }
        toast.success("Kód byl přidán");
      }

      setShowForm(false);
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (c: RvpCode) => {
    if (!confirm(`Opravdu chcete smazat kód "${c.code}"? Bude odstraněn ze všech témat, kde je použit.`)) return;
    try {
      const res = await fetch(`/api/rvp/${c.id}?category=${activeTab}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Smazání selhalo");
      toast.success(`Kód ${c.code} byl smazán`);
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) {
      toast.error("Žádné platné řádky k importu");
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch("/api/rvp/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: activeTab, items: importPreview })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import selhal");

      let msg = `Import dokončen: ${data.created} přidáno, ${data.updated} aktualizováno.`;
      if (data.errors?.length > 0) msg += ` ${data.errors.length} chyb.`;
      toast.success(msg);

      if (data.errors?.length > 0) {
        console.warn("Import errors:", data.errors);
      }

      setShowImport(false);
      setImportText("");
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const currentCodes = codes[activeTab] || [];
  const activeCat = CATEGORIES.find(c => c.key === activeTab)!;

  const filtered = currentCodes.filter(c => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchGrade =
      activeTab !== "ovu" ||
      gradeFilter === "all" ||
      (gradeFilter === "none" && c.grade == null) ||
      (gradeFilter !== "all" && gradeFilter !== "none" && c.grade === parseInt(gradeFilter, 10));
    return matchSearch && matchGrade;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Code2 className="h-8 w-8 text-indigo-500" />
            Číselníky RVP
          </h2>
          <p className="text-slate-400 mt-1">
            Správa kódů očekávaných výstupů, gramotností, klíčových kompetencí a průřezových témat.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm transition"
          >
            <Upload className="h-4 w-4" />
            Hromadný import
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/15"
          >
            <Plus className="h-4 w-4" />
            Přidat kód
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-6 w-fit">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveTab(cat.key); setSearch(""); setGradeFilter("all"); }}
            className={`flex flex-col sm:flex-row items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
              activeTab === cat.key
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${cat.badge}`}>
              {cat.label}
            </span>
            <span className="hidden sm:inline">{cat.fullLabel}</span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={`Hledat v ${activeCat.fullLabel}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition"
          />
        </div>

        {activeTab === "ovu" && (
          <div className="relative">
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none transition appearance-none pr-8 cursor-pointer"
            >
              <option value="all">Všechny ročníky</option>
              <option value="none">Bez ročníku</option>
              {[1,2,3,4,5,6,7,8,9].map(g => (
                <option key={g} value={String(g)}>{g}. ročník</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Code Count Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 font-medium">
          {filtered.length} {filtered.length === 1 ? "kód" : "kódů"} z celkem {currentCodes.length}
        </span>
      </div>

      {/* Codes Table */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Načítání číselníků...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 flex flex-col items-center justify-center text-center">
          <Code2 className="h-14 w-14 text-slate-800 mb-3" />
          <h3 className="text-slate-400 font-semibold text-base">
            {currentCodes.length === 0 ? "Žádné kódy ještě nebyly přidány" : "Žádné kódy neodpovídají filtru"}
          </h3>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            {currentCodes.length === 0
              ? `Přidejte první kód pro ${activeCat.fullLabel} nebo použijte hromadný import.`
              : "Zkuste upravit vyhledávání nebo filtr ročníku."}
          </p>
          {currentCodes.length === 0 && (
            <button
              onClick={openAdd}
              className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              Přidat první kód
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/30">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold w-36">Kód</th>
                <th className="px-4 py-3 font-semibold">Popis</th>
                {activeTab === "ovu" && <th className="px-4 py-3 font-semibold w-24 text-center">Ročník</th>}
                <th className="px-4 py-3 font-semibold w-24 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition group">
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-extrabold tracking-wider px-2 py-1 rounded border ${activeCat.badge}`}>
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 leading-relaxed">{c.description}</td>
                  {activeTab === "ovu" && (
                    <td className="px-4 py-3 text-center">
                      {c.grade != null ? (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {c.grade}. roč.
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-900 transition"
                        title="Upravit kód"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                        title="Smazat kód"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Add / Edit Code */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-white mb-1">
              {editingCode ? "Upravit kód" : "Přidat nový kód"}
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              Kategorie: <span className={`font-extrabold text-[10px] px-1.5 py-0.5 rounded border ${activeCat.badge}`}>{activeCat.label}</span>{" "}
              {activeCat.fullLabel}
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: activeTab === "ovu" ? "1fr 1fr" : "1fr" }}>
                <div className={activeTab === "ovu" ? "" : ""}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Kód *
                  </label>
                  <input
                    type="text"
                    placeholder="např. I-9-1"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none transition"
                    required
                    autoFocus
                  />
                </div>
                {activeTab === "ovu" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Ročník (volitelné)
                    </label>
                    <select
                      value={formGrade}
                      onChange={e => setFormGrade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none transition"
                    >
                      <option value="">— Bez ročníku —</option>
                      {[1,2,3,4,5,6,7,8,9].map(g => (
                        <option key={g} value={String(g)}>{g}. ročník</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Popis *
                </label>
                <textarea
                  rows={3}
                  placeholder="Plný popis kódu..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Ukládám..." : (editingCode ? "Uložit změny" : "Přidat kód")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Import */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-white mb-1">Hromadný import kódů</h4>
            <p className="text-xs text-slate-400 mb-1">
              Kategorie: <span className={`font-extrabold text-[10px] px-1.5 py-0.5 rounded border ${activeCat.badge}`}>{activeCat.label}</span>{" "}
              {activeCat.fullLabel}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Existující kódy (dle sloupce „Kód") budou aktualizovány, nové kódy budou přidány.
            </p>

            {/* Format info */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-5 text-[11px] text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-300">Formát (jeden kód na řádek):</p>
              {activeTab === "ovu" ? (
                <>
                  <code className="text-emerald-400">KÓD;Popis kódu;Ročník</code>
                  <p className="text-slate-500">Ročník je volitelný. Oddělovač: <strong>;</strong> nebo tabulátor.</p>
                  <p className="text-slate-500 mt-1">Příklady:</p>
                  <code className="text-slate-400 block">I-9-1;Žák rozumí pojmu algoritmus;9</code>
                  <code className="text-slate-400 block">I-9-2;Žák dokáže navrhnout jednoduchý program</code>
                </>
              ) : (
                <>
                  <code className={
                    activeTab === "g" ? "text-cyan-400" :
                    activeTab === "kk" ? "text-amber-400" :
                    "text-indigo-400"
                  }>KÓD;Popis kódu</code>
                  <p className="text-slate-500">Oddělovač: <strong>;</strong> nebo tabulátor.</p>
                  <p className="text-slate-500 mt-1">Příklady:</p>
                  <code className="text-slate-400 block">
                    {activeTab === "g" ? "G-DIG;Digitální gramotnost – práce s daty" :
                     activeTab === "kk" ? "KK-RP;Kompetence k řešení problémů" :
                     "PT-OSV;Osobnostní a sociální výchova"}
                  </code>
                </>
              )}
              <p className="text-slate-600 pt-1">Řádky začínající <strong>#</strong> jsou komentáře a budou ignorovány.</p>
            </div>

            {/* Textarea */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Vložte kódy
              </label>
              <textarea
                rows={10}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={
                  activeTab === "ovu"
                    ? "I-9-1;Žák rozumí pojmu algoritmus;9\nI-9-2;Žák dokáže popsat postup řešení jednoduchého problému;9"
                    : activeTab === "g"
                    ? "G-DIG;Digitální gramotnost – práce s daty\nG-MAT;Matematická gramotnost"
                    : activeTab === "kk"
                    ? "KK-RP;Kompetence k řešení problémů\nKK-KOM;Komunikativní kompetence"
                    : "PT-OSV;Osobnostní a sociální výchova\nPT-VDO;Výchova demokratického občana"
                }
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none transition resize-none"
              />
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Náhled importu ({importPreview.length} platných řádků):
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-[11px] text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Kód</th>
                        <th className="px-3 py-2 text-left font-semibold">Popis</th>
                        {activeTab === "ovu" && <th className="px-3 py-2 text-left font-semibold">Ročník</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {importPreview.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-mono text-emerald-400">{item.code}</td>
                          <td className="px-3 py-1.5 text-slate-400">{item.description}</td>
                          {activeTab === "ovu" && (
                            <td className="px-3 py-1.5 text-slate-500">{item.grade ?? "—"}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importText.trim() && importPreview.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-4 bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Žádné platné řádky. Zkontrolujte formát (KÓD;Popis nebo KÓD{`\t`}Popis).
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportText(""); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Zrušit
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || importPreview.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isImporting ? "Importuji..." : `Importovat ${importPreview.length} kódů`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

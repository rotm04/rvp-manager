"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowRight,
  FolderPlus,
  BookMarked,
  Layers,
  Sparkles,
  Info,
  Clock,
  Settings
} from "lucide-react";

interface RvpItemType {
  id: string;
  code: string;
  description: string;
  grade?: number | null;
}

interface PlanItemType {
  id: string;
  topic: string;
  description: string;
  pocetHodin: number;
  ovuItems: RvpItemType[];
  gItems: RvpItemType[];
  kkItems: RvpItemType[];
  ptItems: RvpItemType[];
  order: number;
}

interface PlanType {
  id: string;
  name: string;
  grade: number;
  description: string | null;
  items: PlanItemType[];
}

interface RvpCodelistsType {
  ovu: RvpItemType[];
  g: RvpItemType[];
  kk: RvpItemType[];
  pt: RvpItemType[];
}

export default function CurriculumPage() {
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(9);
  const [isLoading, setIsLoading] = useState(true);

  // Master RVP lists loaded from API
  const [rvpCodelists, setRvpCodelists] = useState<RvpCodelistsType>({
    ovu: [],
    g: [],
    kk: [],
    pt: []
  });
  const [isLoadingRvp, setIsLoadingRvp] = useState(false);

  // Modal toggles
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<PlanItemType | null>(null);

  // Form states for Plan
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanDesc, setEditPlanDesc] = useState("");

  // Plan Item Form states (for both Add and Edit)
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [pocetHodin, setPocetHodin] = useState("1");
  
  // Checked RVP IDs
  const [checkedOvuIds, setCheckedOvuIds] = useState<string[]>([]);
  const [checkedGIds, setCheckedGIds] = useState<string[]>([]);
  const [checkedKkIds, setCheckedKkIds] = useState<string[]>([]);
  const [checkedPtIds, setCheckedPtIds] = useState<string[]>([]);

  // Load plans on mount or grade change
  useEffect(() => {
    fetchPlans(selectedGrade);
  }, [selectedGrade]);

  // Load RVP lists on mount
  useEffect(() => {
    fetchRvpCodelists();
  }, []);

  const fetchPlans = async (grade: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/curriculum?grade=${grade}`);
      if (!res.ok) throw new Error("Nelze načíst plány");
      const data = await res.json();
      const sanitizedPlans: PlanType[] = (data || []).map((p: any) => ({
        ...p,
        items: p.items || []
      }));
      setPlans(sanitizedPlans);
      if (sanitizedPlans.length > 0) {
        setSelectedPlan(prev => {
          if (prev) {
            const found = sanitizedPlans.find((p: PlanType) => p.id === prev.id);
            if (found) return found;
          }
          return sanitizedPlans[0];
        });
      } else {
        setSelectedPlan(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se načíst tematické plány");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRvpCodelists = async () => {
    setIsLoadingRvp(true);
    try {
      const res = await fetch("/api/rvp");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRvpCodelists(data);
    } catch (error) {
      console.error("Failed to fetch RVP codelists", error);
    } finally {
      setIsLoadingRvp(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) {
      toast.error("Zadejte název plánu");
      return;
    }

    try {
      const res = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlanName.trim(),
          grade: selectedGrade,
          description: newPlanDesc.trim()
        }),
      });

      if (!res.ok) throw new Error("Vytvoření plánu selhalo");
      
      const createdPlan = await res.json();
      const normalizedPlan = {
        ...createdPlan,
        items: createdPlan.items || []
      };
      toast.success(`Plán ${normalizedPlan.name} byl vytvořen`);
      setNewPlanName("");
      setNewPlanDesc("");
      setShowAddPlan(false);
      
      await fetchPlans(selectedGrade);
      setSelectedPlan(normalizedPlan);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se vytvořit plán");
    }
  };

  const handleOpenEditPlan = () => {
    if (!selectedPlan) return;
    setEditPlanName(selectedPlan.name);
    setEditPlanDesc(selectedPlan.description || "");
    setShowEditPlanModal(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!editPlanName.trim()) {
      toast.error("Zadejte název plánu");
      return;
    }

    try {
      const res = await fetch(`/api/curriculum/${selectedPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPlanName.trim(),
          description: editPlanDesc.trim()
        })
      });

      if (!res.ok) throw new Error("Úprava plánu selhala");

      const updated = await res.json();
      const normalized = {
        ...updated,
        items: updated.items || selectedPlan.items || []
      };
      toast.success("Tematický plán byl upraven");
      setShowEditPlanModal(false);
      setSelectedPlan(normalized);
      fetchPlans(selectedGrade);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se upravit plán");
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    if (!confirm(`Opravdu chcete smazat celý tematický plán "${selectedPlan.name}" a všechna jeho témata?`)) return;

    try {
      const res = await fetch(`/api/curriculum/${selectedPlan.id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Smazání plánu selhalo");

      toast.success(`Plán "${selectedPlan.name}" byl smazán`);
      setSelectedPlan(null);
      fetchPlans(selectedGrade);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se smazat plán");
    }
  };

  const handleOpenAddTopic = () => {
    setTopicName("");
    setTopicDesc("");
    setPocetHodin("1");
    setCheckedOvuIds([]);
    setCheckedGIds([]);
    setCheckedKkIds([]);
    setCheckedPtIds([]);
    
    setEditingTopic(null);
    setShowAddTopic(true);
  };

  const handleOpenEditTopic = (item: PlanItemType) => {
    setTopicName(item.topic);
    setTopicDesc(item.description);
    setPocetHodin(String(item.pocetHodin || 1));
    
    setCheckedOvuIds(item.ovuItems ? item.ovuItems.map(o => o.id) : []);
    setCheckedGIds(item.gItems ? item.gItems.map(g => g.id) : []);
    setCheckedKkIds(item.kkItems ? item.kkItems.map(k => k.id) : []);
    setCheckedPtIds(item.ptItems ? item.ptItems.map(p => p.id) : []);

    setEditingTopic(item);
    setShowAddTopic(true);
  };

  const handleToggleOvu = (id: string) => {
    setCheckedOvuIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleG = (id: string) => {
    setCheckedGIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleKk = (id: string) => {
    setCheckedKkIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleTogglePt = (id: string) => {
    setCheckedPtIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!topicName.trim()) {
      toast.error("Název tématu je povinný");
      return;
    }

    const payload = {
      topic: topicName.trim(),
      description: topicDesc.trim(),
      pocetHodin: parseInt(pocetHodin, 10) || 1,
      ovuIds: checkedOvuIds,
      gIds: checkedGIds,
      kkIds: checkedKkIds,
      ptIds: checkedPtIds
    };

    try {
      let res;
      if (editingTopic) {
        res = await fetch(`/api/curriculum/${selectedPlan.id}/items/${editingTopic.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/curriculum/${selectedPlan.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error("Uložení tématu selhalo");

      toast.success(editingTopic ? "Téma bylo upraveno" : "Nové téma bylo přidáno");
      setShowAddTopic(false);
      setEditingTopic(null);
      
      fetchPlans(selectedGrade);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se uložit téma");
    }
  };

  const handleDeleteTopic = async (itemId: string, name: string) => {
    if (!selectedPlan) return;
    if (!confirm(`Opravdu chcete smazat téma "${name}"?`)) return;

    try {
      const res = await fetch(`/api/curriculum/${selectedPlan.id}/items/${itemId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Smazání tématu selhalo");

      toast.success(`Téma "${name}" bylo smazáno`);
      fetchPlans(selectedGrade);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se smazat téma");
    }
  };

  const planItems = selectedPlan?.items || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            Tematické plány (RVP)
          </h2>
          <p className="text-slate-400 mt-1">
            Příprava osnov, celků a očekávaných výstupů učení (RVP) pro jednotlivé ročníky.
          </p>
        </div>
        
        {/* Grade Selector pills */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition ${
                selectedGrade === g
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {g}. roč
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column: Grade plans list */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">
              Plány ({selectedGrade}. ročník)
            </h3>
            <button
              onClick={() => setShowAddPlan(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              title="Vytvořit nový plán"
            >
              <Plus className="h-4 w-4" /> Přidat
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Načítání...
            </div>
          ) : plans.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-800 rounded-xl">
              <BookMarked className="h-8 w-8 text-slate-800 mb-2" />
              <p className="text-slate-500 text-xs">Žádné plány pro {selectedGrade}. ročník</p>
              <button
                onClick={() => setShowAddPlan(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-2 underline"
              >
                Vytvořit první plán
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const itemsCount = (plan.items || []).length;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 rounded-xl cursor-pointer border transition ${
                      isSelected
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 text-slate-400"
                    }`}
                  >
                    <div className="font-semibold text-sm line-clamp-1">{plan.name}</div>
                    {plan.description && (
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        {plan.description}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-600" />
                      <span>{itemsCount} témat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Selected plan topics & Plan action buttons */}
        <div className="lg:col-span-3 h-[calc(100vh-220px)] min-h-[500px]">
          {selectedPlan ? (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col h-full overflow-hidden">
              
              {/* Header with Edit/Delete Plan buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedPlan.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {selectedPlan.description || "Tento plán nemá žádný popis."}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenEditPlan}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700"
                    title="Upravit název a popis plánu"
                  >
                    <Edit className="h-3.5 w-3.5 text-indigo-400" />
                    Upravit plán
                  </button>
                  
                  <button
                    onClick={handleDeletePlan}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700 hover:border-rose-900/50"
                    title="Odstranit celý tento plán"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Smazat plán
                  </button>

                  <button
                    onClick={handleOpenAddTopic}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/10 ml-2"
                  >
                    <Plus className="h-4 w-4" />
                    Přidat téma
                  </button>
                </div>
              </div>

              {/* Topics List */}
              <div className="flex-1 overflow-y-auto mt-6 pr-1 space-y-4">
                {planItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Sparkles className="h-10 w-10 text-slate-700 mb-2" />
                    <p className="text-slate-400 text-sm">V tomto plánu zatím nejsou žádná témata.</p>
                    <button
                      onClick={handleOpenAddTopic}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1 underline"
                    >
                      Přidat první téma
                    </button>
                  </div>
                ) : (
                  planItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition duration-200 relative group"
                    >
                      {/* Topic title & Actions */}
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex items-start gap-3">
                          <span className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-md mt-0.5">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-slate-200 text-base">{item.topic}</h4>
                              <span className="flex items-center gap-1 text-[11px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800 font-medium">
                                <Clock className="h-3 w-3 text-indigo-400" />
                                {item.pocetHodin || 1} h
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1.5">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditTopic(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-900 transition"
                            title="Upravit téma"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(item.id, item.topic)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                            title="Smazat téma"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* RVP Codes Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-900/60">
                        {/* OVU / G */}
                        <div className="space-y-3">
                          {/* OVU */}
                          {item.ovuItems && item.ovuItems.length > 0 && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {item.ovuItems.map(o => (
                                  <span key={o.id} className="bg-emerald-600/10 text-emerald-400 text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20" title={o.description}>
                                    OVU: {o.code}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-450 space-y-1">
                                {item.ovuItems.map(o => (
                                  <p key={o.id}><strong className="text-slate-400">{o.code}:</strong> {o.description}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* G */}
                          {item.gItems && item.gItems.length > 0 && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {item.gItems.map(g => (
                                  <span key={g.id} className="bg-cyan-600/10 text-cyan-400 text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-cyan-500/20" title={g.description}>
                                    G: {g.code}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-450 space-y-1">
                                {item.gItems.map(g => (
                                  <p key={g.id}><strong className="text-slate-400">{g.code}:</strong> {g.description}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* KK / PT */}
                        <div className="space-y-3">
                          {/* KK */}
                          {item.kkItems && item.kkItems.length > 0 && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {item.kkItems.map(k => (
                                  <span key={k.id} className="bg-amber-600/10 text-amber-400 text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-amber-500/20" title={k.description}>
                                    KK: {k.code}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-450 space-y-1">
                                {item.kkItems.map(k => (
                                  <p key={k.id}><strong className="text-slate-400">{k.code}:</strong> {k.description}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* PT */}
                          {item.ptItems && item.ptItems.length > 0 && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {item.ptItems.map(p => (
                                  <span key={p.id} className="bg-indigo-600/10 text-indigo-400 text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-indigo-500/20" title={p.description}>
                                    PT: {p.code}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-450 space-y-1">
                                {item.ptItems.map(p => (
                                  <p key={p.id}><strong className="text-slate-400">{p.code}:</strong> {p.description}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center h-full">
              <BookOpen className="h-16 w-16 text-slate-800 mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">Vyberte tematický plán</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-1">
                Vyberte existující plán z levého panelu, nebo vytvořte nový pro {selectedGrade}. ročník.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Add Plan */}
      {showAddPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h4 className="text-lg font-bold text-white mb-1">Nový tematický plán</h4>
            <p className="text-xs text-slate-400 mb-4">Vytváříte osnovu pro: <span className="text-indigo-400 font-semibold">{selectedGrade}. ročník</span></p>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Název plánu
                </label>
                <input
                  type="text"
                  placeholder="např. Programování a Algoritmy"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-155"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Popis / Poznámka
                </label>
                <textarea
                  rows={3}
                  placeholder="Volitelný stručný popis plánu..."
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Vytvořit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Plan */}
      {showEditPlanModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h4 className="text-lg font-bold text-white mb-1">Upravit tematický plán</h4>
            <p className="text-xs text-slate-400 mb-4">{selectedGrade}. ročník</p>
            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Název plánu
                </label>
                <input
                  type="text"
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Popis / Poznámka
                </label>
                <textarea
                  rows={3}
                  value={editPlanDesc}
                  onChange={(e) => setEditPlanDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPlanModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Uložit změny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Plan Item (Topic) */}
      {showAddTopic && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-6 sm:my-10">
            <h4 className="text-xl font-bold text-white mb-1">
              {editingTopic ? "Upravit téma výuky" : "Přidat téma výuky"}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Do osnovy: <span className="text-indigo-400 font-semibold">{selectedPlan.name}</span>
            </p>

            <form onSubmit={handleSaveTopic} className="space-y-5">
              {/* Primary Content Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Název tématu *
                  </label>
                  <input
                    type="text"
                    placeholder="např. Práce s proměnnými"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-155"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Časová dotace (hodiny)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pocetHodin}
                    onChange={(e) => setPocetHodin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Stručný popis tématu
                </label>
                <input
                  type="text"
                  placeholder="Základní datové typy a deklarace proměnných"
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition"
                />
              </div>

              {/* RVP Codes Sections Header */}
              <div className="border-t border-slate-800/80 pt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Info className="h-4 w-4" />
                <span>Přiřazení RVP číselníků (můžete vybrat více kódů)</span>
              </div>

              {isLoadingRvp ? (
                <div className="text-xs text-slate-500 text-center py-4">Načítání číselníků RVP...</div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* OVU Checkboxes */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-emerald-400 text-xs">
                        Očekávané výstupy učení (OVU)
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {rvpCodelists.ovu.length} kódů
                      </span>
                    </div>
                    {rvpCodelists.ovu.length === 0 ? (
                      <div className="text-[11px] text-slate-600">Žádné OVU výstupy v databázi.</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {rvpCodelists.ovu.map(o => (
                          <label key={o.id} className="flex items-start gap-2.5 text-[11px] text-slate-300 cursor-pointer hover:text-slate-100">
                            <input
                              type="checkbox"
                              checked={checkedOvuIds.includes(o.id)}
                              onChange={() => handleToggleOvu(o.id)}
                              className="mt-0.5 rounded border-slate-850 bg-slate-950 text-emerald-600 focus:ring-emerald-500/50 h-3.5 w-3.5"
                            />
                            <span>
                              <strong className="text-emerald-400">{o.code}</strong>
                              {o.grade && (
                                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800 font-medium">
                                  {o.grade}. roč.
                                </span>
                              )}
                              : {o.description}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* G Checkboxes */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="font-semibold text-cyan-400 text-xs mb-2">Gramotnosti (G)</div>
                    <div className="space-y-2">
                      {rvpCodelists.g.map(g => (
                        <label key={g.id} className="flex items-start gap-2.5 text-[11px] text-slate-300 cursor-pointer hover:text-slate-100">
                          <input
                              type="checkbox"
                              checked={checkedGIds.includes(g.id)}
                              onChange={() => handleToggleG(g.id)}
                              className="mt-0.5 rounded border-slate-850 bg-slate-950 text-cyan-600 focus:ring-cyan-500/50 h-3.5 w-3.5"
                          />
                          <span>
                            <strong className="text-cyan-400">{g.code}:</strong> {g.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* KK Checkboxes */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="font-semibold text-amber-400 text-xs mb-2">Klíčové kompetence (KK)</div>
                    <div className="space-y-2">
                      {rvpCodelists.kk.map(k => (
                        <label key={k.id} className="flex items-start gap-2.5 text-[11px] text-slate-300 cursor-pointer hover:text-slate-100">
                          <input
                              type="checkbox"
                              checked={checkedKkIds.includes(k.id)}
                              onChange={() => handleToggleKk(k.id)}
                              className="mt-0.5 rounded border-slate-850 bg-slate-950 text-amber-600 focus:ring-amber-500/50 h-3.5 w-3.5"
                          />
                          <span>
                            <strong className="text-amber-400">{k.code}:</strong> {k.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PT Checkboxes */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="font-semibold text-indigo-400 text-xs mb-2">Průřezová témata (PT)</div>
                    <div className="space-y-2">
                      {rvpCodelists.pt.map(p => (
                        <label key={p.id} className="flex items-start gap-2.5 text-[11px] text-slate-300 cursor-pointer hover:text-slate-100">
                          <input
                              type="checkbox"
                              checked={checkedPtIds.includes(p.id)}
                              onChange={() => handleTogglePt(p.id)}
                              className="mt-0.5 rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-indigo-500/50 h-3.5 w-3.5"
                          />
                          <span>
                            <strong className="text-indigo-400">{p.code}:</strong> {p.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTopic(false);
                    setEditingTopic(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/10"
                >
                  <span>{editingTopic ? "Uložit změny" : "Přidat do osnov"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

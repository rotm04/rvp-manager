"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Link2,
  ChevronDown,
  Info,
  CalendarDays,
  FileCode,
  GraduationCap,
  ClipboardList,
  AlertCircle,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  X,
  Eye
} from "lucide-react";

interface ClassType {
  id: string;
  name: string;
  grade: number;
  color?: string;
}

interface LessonType {
  id: string;
  classId: string;
  class: {
    name: string;
    grade: number;
    color?: string;
  };
  date: string;
  delkaTrvani: number;
  konec: string;
  status: string;
  topic: string;
  description: string;
  ovuCode: string;
  ovuDescription: string;
  gCode: string;
  gDescription: string;
  kkCode: string;
  kkDescription: string;
  ptCode: string;
  ptDescription: string;
}

interface TaskType {
  id: string;
  classId: string;
  title: string;
  datumZadani: string;
  dueDate: string | null;
}

interface CurriculumPlanItemType {
  id: string;
  topic: string;
  description: string;
  pocetHodin?: number;
  planName?: string;
  planGrade?: number;
  ovuItems?: { code: string; description: string }[];
  gItems?: { code: string; description: string }[];
  kkItems?: { code: string; description: string }[];
  ptItems?: { code: string; description: string }[];
  ovuCode?: string;
  ovuDescription?: string;
  gCode?: string;
  gDescription?: string;
  kkCode?: string;
  kkDescription?: string;
  ptCode?: string;
  ptDescription?: string;
}

interface CurriculumPlanType {
  id: string;
  name: string;
  grade: number;
  items: CurriculumPlanItemType[];
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // View state: "list" or "week"
  const [viewMode, setViewMode] = useState<"list" | "week">("week");
  
  // Weekly Calendar Navigation (Start date of the displayed Monday)
  const [currentMonday, setCurrentMonday] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Modals / Toggles
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonType | null>(null);

  // Generator form state
  const [genClassId, setGenClassId] = useState("");
  const [genStartDate, setGenStartDate] = useState("");
  const [genTime, setGenTime] = useState("08:00");
  const [genRecurring, setGenRecurring] = useState(false);
  const [genWeeksCount, setGenWeeksCount] = useState("10");
  const [genDuration, setGenDuration] = useState("45");
  const [genPlanId, setGenPlanId] = useState("");

  const [genAvailablePlans, setGenAvailablePlans] = useState<CurriculumPlanType[]>([]);

  // Lesson editor state
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("45");
  const [editStatus, setEditStatus] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [editDesc, setEditDesc] = useState("");
  
  const [editOvuCode, setEditOvuCode] = useState("");
  const [editOvuDesc, setEditOvuDesc] = useState("");
  const [editGCode, setEditGCode] = useState("");
  const [editGDesc, setEditGDesc] = useState("");
  const [editKkCode, setEditKkCode] = useState("");
  const [editKkDesc, setEditKkDesc] = useState("");
  const [editPtCode, setEditPtCode] = useState("");
  const [editPtDesc, setEditPtDesc] = useState("");

  const [availableCurriculumItems, setAvailableCurriculumItems] = useState<CurriculumPlanItemType[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importClassId, setImportClassId] = useState("");
  const [importStartDate, setImportStartDate] = useState("");
  const [importTime, setImportTime] = useState("08:00");
  const [importDuration, setImportDuration] = useState("45");
  const [importInterval, setImportInterval] = useState("7");
  const [importCreatePlan, setImportCreatePlan] = useState(false);
  const [importPlanName, setImportPlanName] = useState("");
  const [importText, setImportText] = useState("");
  const [importParsed, setImportParsed] = useState<{ lessonNumber: number; topic: string; description: string; codes: string[] }[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Parse import text whenever it changes
  useEffect(() => {
    if (!importText.trim()) {
      setImportParsed([]);
      return;
    }
    const lines = importText.split("\n").map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith("#"));
    const parsed = lines.map(line => {
      // Detect separator: tab-separated (from Excel/Sheets paste) or semicolons
      const sep = line.includes("\t") ? "\t" : ";";
      const parts = line.split(sep).map(p => p.trim());
      if (parts.length < 2) return null;

      // Extract columns: number, topic, description, codes
      let lessonNumber = 0;
      let topic = "";
      let description = "";
      let codesStr = "";

      if (parts.length >= 4) {
        // Full 4-column format
        lessonNumber = parseInt(parts[0].replace(/\.$/, ""), 10) || 0;
        topic = parts[1];
        description = parts[2];
        codesStr = parts[3];
      } else if (parts.length === 3) {
        // 3 columns: could be number;topic;desc or topic;desc;codes
        const firstNum = parseInt(parts[0].replace(/\.$/, ""), 10);
        if (!isNaN(firstNum) && parts[0].replace(/\.$/, "").match(/^\d+$/)) {
          lessonNumber = firstNum;
          topic = parts[1];
          description = parts[2];
        } else {
          topic = parts[0];
          description = parts[1];
          codesStr = parts[2];
        }
      } else if (parts.length === 2) {
        topic = parts[0];
        description = parts[1];
      }

      if (!topic) return null;

      const codes = codesStr
        ? codesStr.split(",").map(c => c.trim()).filter(Boolean)
        : [];

      return { lessonNumber: lessonNumber || 0, topic, description, codes };
    }).filter(Boolean) as { lessonNumber: number; topic: string; description: string; codes: string[] }[];

    // Auto-assign lesson numbers if they are all zero
    const allZero = parsed.every(p => p.lessonNumber === 0);
    if (allZero) {
      parsed.forEach((p, i) => { p.lessonNumber = i + 1; });
    }

    setImportParsed(parsed);
  }, [importText]);

  useEffect(() => {
    fetchLessons();
    fetchClasses();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (genClassId) {
      const cls = classes.find(c => c.id === genClassId);
      if (cls) {
        fetchPlansForGenerator(cls.grade);
      }
    }
  }, [genClassId, classes]);

  useEffect(() => {
    if (editingLesson) {
      fetchCurriculumItems();
    } else {
      setAvailableCurriculumItems([]);
    }
  }, [editingLesson]);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/lessons");
      if (!res.ok) throw new Error("Nelze načíst vyučovací hodiny");
      const data = await res.json();
      setLessons(data);
    } catch (error: any) {
      toast.error(error.message || "Chyba při načítání hodin");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) {
        setGenClassId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch classes");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks");
    }
  };

  const fetchPlansForGenerator = async (grade: number) => {
    try {
      const res = await fetch(`/api/curriculum?grade=${grade}`);
      if (res.ok) {
        const data = await res.json();
        setGenAvailablePlans(data);
      }
    } catch (error) {
      console.error("Failed to load plans for generator class grade", error);
    }
  };

  const fetchCurriculumItems = async () => {
    setIsLoadingCurriculum(true);
    try {
      const res = await fetch(`/api/curriculum`);
      if (!res.ok) throw new Error();
      const data: CurriculumPlanType[] = await res.json();
      const items: CurriculumPlanItemType[] = data.flatMap(plan =>
        (plan.items || []).map(item => ({
          ...item,
          planName: plan.name,
          planGrade: plan.grade
        }))
      );
      setAvailableCurriculumItems(items);
    } catch (error) {
      console.error("Failed to load curriculum items");
    } finally {
      setIsLoadingCurriculum(false);
    }
  };

  const handleGenerateLessons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genClassId || !genStartDate || !genTime) {
      toast.error("Vyplňte všechna povinná pole");
      return;
    }

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: genClassId,
          recurring: genRecurring,
          startDate: genStartDate,
          time: genTime,
          weeksCount: genRecurring ? parseInt(genWeeksCount, 10) : 1,
          delkaTrvani: parseInt(genDuration, 10) || 45,
          curriculumPlanId: genPlanId || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generování selhalo");

      toast.success(data.message || "Hodiny byly vygenerovány");
      setShowGenerateModal(false);
      setGenPlanId("");
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se vygenerovat hodiny");
    }
  };

  const handleImportLessons = async () => {
    if (!importClassId) {
      toast.error("Vyberte třídu!");
      return;
    }
    if (!importStartDate || !importTime) {
      toast.error("Vyplňte počáteční datum a čas!");
      return;
    }
    if (importParsed.length === 0) {
      toast.error("Nejsou k dispozici žádné platné položky k importu!");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/lessons/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: importClassId,
          startDate: importStartDate,
          time: importTime,
          delkaTrvani: parseInt(importDuration, 10) || 45,
          intervalDays: parseInt(importInterval, 10) || 7,
          createCurriculumPlan: importCreatePlan,
          planName: importPlanName || undefined,
          items: importParsed
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import selhal");

      toast.success(data.message || `Naimportováno ${data.count} hodin`);
      if (data.planCreated) {
        toast.success("Tematický plán byl vytvořen.");
      }

      // Reset
      setShowImportModal(false);
      setImportText("");
      setImportParsed([]);
      setImportCreatePlan(false);
      setImportPlanName("");
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || "Import hodin selhal");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setImportText(text);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleOpenEdit = (lesson: LessonType) => {
    const d = new Date(lesson.date);
    const dateStr = d.toISOString().split("T")[0];
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${mins}`;

    setEditingLesson(lesson);
    setEditDate(dateStr);
    setEditTime(timeStr);
    setEditDuration(String(lesson.delkaTrvani || 45));
    setEditStatus(lesson.status);
    setEditTopic(lesson.topic);
    setEditDesc(lesson.description);
    
    setEditOvuCode(lesson.ovuCode || "");
    setEditOvuDesc(lesson.ovuDescription || "");
    setEditGCode(lesson.gCode || "");
    setEditGDesc(lesson.gDescription || "");
    setEditKkCode(lesson.kkCode || "");
    setEditKkDesc(lesson.kkDescription || "");
    setEditPtCode(lesson.ptCode || "");
    setEditPtDesc(lesson.ptDescription || "");
  };

  const handleLinkTemplate = (itemId: string) => {
    const item = availableCurriculumItems.find(i => i.id === itemId);
    if (!item) return;

    const oCodes = item.ovuItems ? item.ovuItems.map(o => o.code).join(", ") : (item.ovuCode || "");
    const oDescs = item.ovuItems ? item.ovuItems.map(o => o.description).join("\n") : (item.ovuDescription || "");
    const gCodes = item.gItems ? item.gItems.map(g => g.code).join(", ") : (item.gCode || "");
    const gDescs = item.gItems ? item.gItems.map(g => g.description).join("\n") : (item.gDescription || "");
    const kCodes = item.kkItems ? item.kkItems.map(k => k.code).join(", ") : (item.kkCode || "");
    const kDescs = item.kkItems ? item.kkItems.map(k => k.description).join("\n") : (item.kkDescription || "");
    const pCodes = item.ptItems ? item.ptItems.map(p => p.code).join(", ") : (item.ptCode || "");
    const pDescs = item.ptItems ? item.ptItems.map(p => p.description).join("\n") : (item.ptDescription || "");

    setEditTopic(item.topic);
    setEditDesc(item.description);
    setEditOvuCode(oCodes);
    setEditOvuDesc(oDescs);
    setEditGCode(gCodes);
    setEditGDesc(gDescs);
    setEditKkCode(kCodes);
    setEditKkDesc(kDescs);
    setEditPtCode(pCodes);
    setEditPtDesc(pDescs);

    toast.success("Téma z RVP plánu bylo propsáno!");
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    try {
      const fullDateTime = new Date(`${editDate}T${editTime}:00`);

      const res = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: fullDateTime.toISOString(),
          delkaTrvani: parseInt(editDuration, 10) || 45,
          status: editStatus,
          topic: editTopic,
          description: editDesc,
          ovuCode: editOvuCode,
          ovuDescription: editOvuDesc,
          gCode: editGCode,
          gDescription: editGDesc,
          kkCode: editKkCode,
          kkDescription: editKkDesc,
          ptCode: editPtCode,
          ptDescription: editPtDesc
        })
      });

      if (!res.ok) throw new Error("Úprava hodiny selhala");

      toast.success("Hodina byla aktualizována");
      setEditingLesson(null);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se hodinu upravit");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Opravdu chcete tuto hodinu smazat?")) return;

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Smazání hodiny selhalo");

      toast.success("Hodina byla smazána");
      setEditingLesson(null);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se smazat hodinu");
    }
  };

  const getLocalDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const filteredLessons = lessons.filter(l => {
    if (selectedClassFilter === "all") return true;
    return l.classId === selectedClassFilter;
  });

  // Week helpers
  const changeWeek = (direction: number) => {
    const newMon = new Date(currentMonday);
    newMon.setDate(newMon.getDate() + direction * 7);
    setCurrentMonday(newMon);
  };

  const goToTodayWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentMonday(monday);
  };

  // Generate 7 days for current week (Monday - Sunday)
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const dayDate = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + offset);
    return dayDate;
  });

  const dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-indigo-500" />
            Výukové hodiny (Kalendář)
          </h2>
          <p className="text-slate-400 mt-1">
            Plánování rozvrhu, týdenní zobrazení a provázání s barvami tříd i RVP.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "week"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Týden
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Seznam
            </button>
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none transition appearance-none pr-8 cursor-pointer"
            >
              <option value="all">Všechny třídy</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              if (classes.length === 0) {
                toast.error("Nejprve musíte vytvořit nějakou třídu!");
                return;
              }
              setShowGenerateModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition duration-200 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-5 w-5" />
            Generovat hodiny
          </button>
          <button
            onClick={() => {
              if (classes.length === 0) {
                toast.error("Nejprve musíte vytvořit nějakou třídu!");
                return;
              }
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium transition duration-200 shadow-lg shadow-emerald-600/10"
          >
            <FileSpreadsheet className="h-5 w-5" />
            Importovat z tabulky
          </button>
        </div>
      </div>

      {/* WEEK NAVIGATION BAR (Only visible in week view) */}
      {viewMode === "week" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeWeek(-1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Předchozí týden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToTodayWeek}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Dnes
            </button>
            <button
              onClick={() => changeWeek(1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Následující týden"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm font-bold text-white tracking-wide">
            {weekDays[0].toLocaleDateString("cs-CZ", { day: "numeric", month: "long" })} – {weekDays[6].toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      )}

      {/* Content Rendering: Week View or List View */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          Načítání rozpisu hodin...
        </div>
      ) : viewMode === "week" ? (
        /* WEEKLY GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayDate, i) => {
            const dayStr = getLocalDateString(dayDate.toISOString());
            const isToday = getLocalDateString(new Date().toISOString()) === dayStr;

            // Lessons on this day
            const dayLessons = filteredLessons.filter(l => getLocalDateString(l.date) === dayStr);

            return (
              <div
                key={dayStr}
                className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-3 min-h-[450px] flex flex-col ${
                  isToday ? "border-indigo-500/80 bg-indigo-950/10" : "border-slate-800/80"
                }`}
              >
                {/* Day Header */}
                <div className="pb-2.5 mb-3 border-b border-slate-800 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    {dayNames[i]}
                  </div>
                  <div className={`text-base font-extrabold mt-0.5 ${
                    isToday ? "text-indigo-400" : "text-white"
                  }`}>
                    {dayDate.getDate()}. {dayDate.getMonth() + 1}.
                  </div>
                </div>

                {/* Day Events */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {dayLessons.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-600 text-center py-8">
                      Volno
                    </div>
                  ) : (
                    dayLessons.map((lesson) => {
                      const lessonDate = new Date(lesson.date);
                      const lessonEndDate = lesson.konec ? new Date(lesson.konec) : new Date(lessonDate.getTime() + (lesson.delkaTrvani || 45) * 60 * 1000);
                      const classColor = lesson.class?.color || "#4f46e5";

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleOpenEdit(lesson)}
                          style={{ borderColor: `${classColor}60` }}
                          className="bg-slate-950/70 border rounded-xl p-3 cursor-pointer hover:scale-[1.02] transition-all duration-200 relative group overflow-hidden"
                        >
                          {/* Color bar indicator on left */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5" 
                            style={{ backgroundColor: classColor }}
                          />

                          <div className="pl-1.5">
                            {/* Class Badge */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span 
                                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wider uppercase truncate"
                                style={{ backgroundColor: classColor }}
                              >
                                {lesson.class.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {lessonDate.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <h5 className="font-bold text-slate-100 text-xs line-clamp-1 mt-1">
                              {lesson.topic}
                            </h5>

                            {/* Duration */}
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span>{lesson.delkaTrvani || 45} min</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        filteredLessons.length === 0 ? (
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center">
            <CalendarDays className="h-16 w-16 text-slate-850 mb-3" />
            <h3 className="text-lg font-semibold text-slate-400">Žádné hodiny nenalezeny</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-1">
              Zatím nebyly naplánovány žádné hodiny. Klikněte na tlačítko "Generovat hodiny" pro zahájení.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => {
              const lessonDate = new Date(lesson.date);
              const lessonEndDate = lesson.konec ? new Date(lesson.konec) : new Date(lessonDate.getTime() + (lesson.delkaTrvani || 45) * 60 * 1000);
              const classColor = lesson.class?.color || "#4f46e5";

              const isCancelled = lesson.status === "cancelled";
              const isCompleted = lesson.status === "completed";

              const lessonDayStr = getLocalDateString(lesson.date);
              const matchedTasks = tasks.filter(t => t.classId === lesson.classId);
              
              const assignedTasks = matchedTasks.filter(t => getLocalDateString(t.datumZadani) === lessonDayStr);
              const dueTasks = matchedTasks.filter(t => t.dueDate && getLocalDateString(t.dueDate) === lessonDayStr);
              
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleOpenEdit(lesson)}
                  className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between ${
                    isCancelled 
                      ? "border-rose-950/45 bg-rose-950/5/20 opacity-70"
                      : isCompleted
                        ? "border-emerald-950/45 bg-emerald-950/5/20"
                        : "border-slate-800/80 hover:border-slate-700/80"
                  }`}
                >
                  <div>
                    {/* Class Badge & Time */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm"
                          style={{ backgroundColor: classColor }}
                        >
                          {lesson.class.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {lesson.class.grade}. ročník
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        <span>
                          {lessonDate.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {lessonEndDate.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-slate-200 font-bold text-sm mb-2">
                      {lessonDate.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
                    </div>

                    {/* Topic Title */}
                    <h4 className="font-extrabold text-slate-100 text-base line-clamp-1 mb-1">
                      {lesson.topic}
                    </h4>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-3">
                      {lesson.description}
                    </p>

                    {/* CALENDAR-LINKED TASKS */}
                    {(assignedTasks.length > 0 || dueTasks.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-slate-900 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        {assignedTasks.map(t => (
                          <div key={t.id} className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-900/50 rounded-lg p-2 text-[10px] text-indigo-300">
                            <ClipboardList className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate"><strong>Zadán úkol:</strong> {t.title}</span>
                          </div>
                        ))}
                        {dueTasks.map(t => (
                          <div key={t.id} className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-900/40 rounded-lg p-2 text-[10px] text-rose-350">
                            <AlertCircle className="h-3.5 w-3.5 text-rose-450 shrink-0" />
                            <span className="truncate"><strong>Odevzdání úkolu:</strong> {t.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status & RVP Indicators */}
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <div>
                      {isCancelled && (
                        <span className="flex items-center gap-1 text-rose-400 text-[10px] font-semibold uppercase tracking-wider">
                          <XCircle className="h-3.5 w-3.5" /> Zrušeno
                        </span>
                      )}
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Odcvičeno
                        </span>
                      )}
                      {!isCancelled && !isCompleted && (
                        <span className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                          <Clock className="h-3.5 w-3.5 text-slate-600" /> Naplánováno
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {lesson.ovuCode && (
                        <span className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          OVU
                        </span>
                      )}
                      {lesson.gCode && (
                        <span className="bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          G
                        </span>
                      )}
                      {lesson.kkCode && (
                        <span className="bg-amber-600/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          KK
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}

      {/* MODAL: Generate Lessons */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative my-6 sm:my-10">
            <h4 className="text-lg font-bold text-white mb-4">Generovat rozpis hodin</h4>
            <form onSubmit={handleGenerateLessons} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Třída / Skupina
                </label>
                <select
                  value={genClassId}
                  onChange={(e) => setGenClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition duration-155"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade}. ročník)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Hromadně přiřadit Tematický plán
                </label>
                <select
                  value={genPlanId}
                  onChange={(e) => setGenPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-205 focus:outline-none transition duration-155"
                >
                  <option value="">-- Bez hromadného přiřazení --</option>
                  {genAvailablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.items?.length || 0} témat)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Počáteční datum
                  </label>
                  <input
                    type="date"
                    value={genStartDate}
                    onChange={(e) => setGenStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-250 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Čas zahájení
                  </label>
                  <input
                    type="time"
                    value={genTime}
                    onChange={(e) => setGenTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-250 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Délka trvání (minut)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={genDuration}
                    onChange={(e) => setGenDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-250 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genRecurring}
                    onChange={(e) => setGenRecurring(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-650"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-200">Generovat jako opakující se</span>
                    <p className="text-[11px] text-slate-500 leading-normal">Vytvoří sérii hodin v týdenním intervalu.</p>
                  </div>
                </label>

                {genRecurring && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1.5">
                      Počet týdnů (počet hodin)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={genWeeksCount}
                      onChange={(e) => setGenWeeksCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none transition"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/10"
                >
                  Generovat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit/Inspect Lesson */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative my-6 sm:my-10">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">Detail vyučovací hodiny</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span 
                    className="text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm"
                    style={{ backgroundColor: editingLesson.class?.color || "#4f46e5" }}
                  >
                    Třída {editingLesson.class.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {editingLesson.class.grade}. ročník
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteLesson(editingLesson.id)}
                className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-950 transition flex items-center gap-1.5 text-xs font-semibold"
                title="Smazat tuto hodinu"
              >
                <Trash2 className="h-4.5 w-4.5" />
                Smazat hodinu
              </button>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 mb-6">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Link2 className="h-4 w-4" />
                <span>Rychlé propojení s Tematickým plánem RVP</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal mb-3">
                Vyberte téma z libovolného tematického plánu. Kopírováním se automaticky vyplní název, popis a sloučené RVP kódy (včetně všech OVU napříč ročníky).
              </p>
              
              {isLoadingCurriculum ? (
                <div className="text-xs text-slate-500 font-medium">Načítání témat z plánů...</div>
              ) : availableCurriculumItems.length === 0 ? (
                <div className="text-xs text-amber-500/90 font-medium">
                  Zatím nemáte vytvořené žádné tematické plány!
                </div>
              ) : (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleLinkTemplate(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg focus:outline-none transition appearance-none pr-8 cursor-pointer"
                  >
                    <option value="">-- Vyberte téma z plánu --</option>
                    {availableCurriculumItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.topic} ({item.pocetHodin || 1}h) {item.planName ? `[${item.planName} · ${item.planGrade}. roč]` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateLesson} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Datum hodiny
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Čas konání
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Délka (minut)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Stav hodiny
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none transition"
                  >
                    <option value="scheduled">Naplánováno</option>
                    <option value="completed">Odcvičeno</option>
                    <option value="cancelled">Zrušeno</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Téma hodiny
                  </label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Popis / Průběh hodiny
                  </label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <FileCode className="h-4 w-4" />
                <span>Přepsat kódy a popisy RVP (pouze pro tuto konkrétní hodinu)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="font-semibold text-emerald-450 text-xs">Očekávané výstupy (OVU)</div>
                  <input
                    type="text"
                    placeholder="Kódy (oddělené čárkou)"
                    value={editOvuCode}
                    onChange={(e) => setEditOvuCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                  <textarea
                    rows={2}
                    placeholder="Popisy výstupů"
                    value={editOvuDesc}
                    onChange={(e) => setEditOvuDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="font-semibold text-cyan-450 text-xs">Digitální gramotnost (G)</div>
                  <input
                    type="text"
                    placeholder="Kódy (např. G-DIGI)"
                    value={editGCode}
                    onChange={(e) => setEditGCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                  <textarea
                    rows={2}
                    placeholder="Popisy gramotností"
                    value={editGDesc}
                    onChange={(e) => setEditGDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="font-semibold text-amber-450 text-xs">Klíčové kompetence (KK)</div>
                  <input
                    type="text"
                    placeholder="Kódy (např. KK-RP)"
                    value={editKkCode}
                    onChange={(e) => setEditKkCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                  <textarea
                    rows={2}
                    placeholder="Popisy kompetencí"
                    value={editKkDesc}
                    onChange={(e) => setEditKkDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="font-semibold text-indigo-400 text-xs">Průřezová témata (PT)</div>
                  <input
                    type="text"
                    placeholder="Kódy (např. PT-OSV)"
                    value={editPtCode}
                    onChange={(e) => setEditPtCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                  <textarea
                    rows={2}
                    placeholder="Popisy průřezových témat"
                    value={editPtDesc}
                    onChange={(e) => setEditPtDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zavřít
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/15"
                >
                  Uložit změny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== IMPORT MODAL ===== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl my-6 sm:my-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                Importovat výukové hodiny z tabulky
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Row 1: Class, Date, Time, Duration, Interval */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Třída *</label>
                  <select
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">— Vyberte —</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">1. hodina – datum *</label>
                  <input
                    type="date"
                    value={importStartDate}
                    onChange={(e) => setImportStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Čas *</label>
                  <input
                    type="time"
                    value={importTime}
                    onChange={(e) => setImportTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Délka (min)</label>
                  <input
                    type="number"
                    value={importDuration}
                    onChange={(e) => setImportDuration(e.target.value)}
                    min="1"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Interval (dní)</label>
                  <input
                    type="number"
                    value={importInterval}
                    onChange={(e) => setImportInterval(e.target.value)}
                    min="1"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
                <p className="text-xs text-emerald-300 leading-relaxed">
                  <strong>Formát vstupu:</strong> Vložte tabulku z Excelu / Google Sheets (Ctrl+V) nebo CSV soubor. 
                  Každý řádek = 1 hodina se 4 sloupci oddělenými <strong>tabulátory</strong> (z Excelu) nebo <strong>středníky</strong> (CSV):{" "}
                  <code className="bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-200">číslo;téma;popis;kódy RVP</code>.
                  Kódy RVP oddělujte čárkou (např. <code className="bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-200">INF-INF-002-ZV5-004, KRP-RPS-000-ZV5-001</code>).
                </p>
              </div>

              {/* Textarea + File Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400">Data hodin *</label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer transition">
                    <Upload className="h-4 w-4" />
                    Nahrát CSV / TXT
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={handleImportFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={8}
                  placeholder={`1.\tAlgoritmy bez počítače (Unplugged)\tPřesné formulování příkazů.\tINF-INF-002-ZV5-004, KRP-RPS-000-ZV5-001\n2.\tÚvod do Scratche\tSeznamení s prostředím Scratch.\tINF-INF-002-ZV5-003\n3.\tPodmínky a rozhodování\tVětve v programu – if/else.\tINF-INF-002-ZV5-004`}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono resize-y"
                />
              </div>

              {/* Optional: Create curriculum plan */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-950/60 border border-slate-800/60 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importCreatePlan}
                    onChange={(e) => setImportCreatePlan(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                  />
                  <span className="text-sm text-slate-300 font-medium">Zároveň vytvořit Tematický plán</span>
                </label>
                {importCreatePlan && (
                  <input
                    type="text"
                    value={importPlanName}
                    onChange={(e) => setImportPlanName(e.target.value)}
                    placeholder="Název plánu (volitelné)"
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                )}
              </div>

              {/* Preview Table */}
              {importParsed.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    Náhled ({importParsed.length} hodin)
                  </h4>
                  <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold w-12">#</th>
                          <th className="px-3 py-2 text-left font-semibold">Téma</th>
                          <th className="px-3 py-2 text-left font-semibold">Popis</th>
                          <th className="px-3 py-2 text-left font-semibold">Datum</th>
                          <th className="px-3 py-2 text-left font-semibold">Kódy RVP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {importParsed.map((row, idx) => {
                          // Compute date for preview
                          let dateStr = "—";
                          if (importStartDate && importTime) {
                            const base = new Date(`${importStartDate}T${importTime}:00`);
                            const lessonIdx = (row.lessonNumber && row.lessonNumber > 0) ? row.lessonNumber - 1 : idx;
                            const d = new Date(base.getTime() + lessonIdx * (parseInt(importInterval, 10) || 7) * 24 * 60 * 60 * 1000);
                            dateStr = d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" });
                          }
                          return (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="px-3 py-2 text-slate-500 font-mono">{row.lessonNumber || idx + 1}.</td>
                              <td className="px-3 py-2 text-slate-200 font-medium max-w-[180px] truncate">{row.topic}</td>
                              <td className="px-3 py-2 text-slate-400 max-w-[200px] truncate">{row.description || "—"}</td>
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{dateStr}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {row.codes.length > 0 ? row.codes.map((code, ci) => {
                                    const cu = code.toUpperCase();
                                    let color = "bg-blue-900/50 text-blue-300 border-blue-800/60";
                                    if (cu.startsWith("KRP-") || cu.startsWith("KKK-") || cu.startsWith("KOM-") || cu.startsWith("K-") || cu.startsWith("KK-")) {
                                      color = "bg-amber-900/50 text-amber-300 border-amber-800/60";
                                    } else if (cu.startsWith("PT-") || cu.startsWith("VDO-") || cu.startsWith("OSV-") || cu.startsWith("EGS-") || cu.startsWith("EV-") || cu.startsWith("MV-")) {
                                      color = "bg-purple-900/50 text-purple-300 border-purple-800/60";
                                    } else if (cu.startsWith("G-") || cu.startsWith("DIG-")) {
                                      color = "bg-emerald-900/50 text-emerald-300 border-emerald-800/60";
                                    }
                                    return (
                                      <span key={ci} className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${color}`}>
                                        {code}
                                      </span>
                                    );
                                  }) : <span className="text-slate-600">—</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleImportLessons}
                  disabled={isImporting || importParsed.length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/15"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      Importuji...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Importovat {importParsed.length} hodin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  FileSpreadsheet, 
  ChevronRight,
  FolderOpen,
  Info,
  GraduationCap,
  Palette,
  UserCheck,
  UserX,
  ExternalLink
} from "lucide-react";

interface ClassType {
  id: string;
  name: string;
  grade: number;
  color?: string;
  _count?: {
    students: number;
  };
}

interface StudentType {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  classes?: { id: string; name: string }[];
}

const COLOR_OPTIONS = [
  "#4f46e5", "#6366f1", "#818cf8", "#3b82f6", "#60a5fa", "#0284c7", "#38bdf8", "#06b6d4",
  "#22d3ee", "#14b8a6", "#2dd4bf", "#10b981", "#34d399", "#059669", "#16a34a", "#4ade80",
  "#65a30d", "#a3e635", "#84cc16", "#eab308", "#facc15", "#d97706", "#fbbf24", "#f97316",
  "#fb923c", "#ea580c", "#ef4444", "#f87171", "#dc2626", "#e11d48", "#fb7185", "#f43f5e",
  "#d946ef", "#e879f9", "#c084fc", "#a855f7", "#9333ea", "#7e22ce", "#8b5cf6", "#7c3aed",
  "#4c1d95", "#312e81", "#1e1b4b", "#0f172a", "#334155", "#475569", "#64748b", "#0d9488",
  "#0891b2", "#2563eb"
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [students, setStudents] = useState<StudentType[]>([]);
  const [allGlobalStudents, setAllGlobalStudents] = useState<StudentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // Modals / Form toggles
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [studentAddMode, setStudentAddMode] = useState<"new" | "existing">("new");
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState("");

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("9");
  const [newClassColor, setNewClassColor] = useState(COLOR_OPTIONS[0]);
  
  const [newStudentFirst, setNewStudentFirst] = useState("");
  const [newStudentLast, setNewStudentLast] = useState("");
  
  const [bulkText, setBulkText] = useState("");

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
    fetchGlobalStudents();
  }, []);

  // Fetch students when selected class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Nelze načíst třídy");
      const data = await res.json();
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0]);
      }
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se načíst třídy");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalStudents = async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setAllGlobalStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch global students directory");
    }
  };

  const fetchStudents = async (classId: string) => {
    setIsStudentsLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`);
      if (!res.ok) throw new Error("Nelze načíst žáky");
      const data = await res.json();
      setStudents(data);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se načíst žáky");
    } finally {
      setIsStudentsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      toast.error("Zadejte název třídy");
      return;
    }

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          grade: parseInt(newClassGrade, 10),
          color: newClassColor
        }),
      });

      if (!res.ok) throw new Error("Vytvoření třídy selhalo");
      
      const createdClass = await res.json();
      toast.success(`Třída ${createdClass.name} byla vytvořena`);
      setNewClassName("");
      setNewClassColor(COLOR_OPTIONS[0]);
      setShowAddClass(false);
      
      await fetchClasses();
      setSelectedClass(createdClass);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se vytvořit třídu");
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Opravdu chcete smazat třídu ${className}? Žáci v databázi zůstanou zachováni.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Smazání třídy selhalo");

      toast.success(`Třída ${className} byla smazána`);
      setSelectedClass(null);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se smazat třídu");
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    if (studentAddMode === "existing") {
      if (!selectedExistingStudentId) {
        toast.error("Vyberte žáka ze seznamu");
        return;
      }

      try {
        const res = await fetch(`/api/classes/${selectedClass.id}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "assign_existing",
            studentId: selectedExistingStudentId
          })
        });

        if (!res.ok) throw new Error("Přiřazení žáka selhalo");

        toast.success("Žák byl přiřazen do třídy");
        setShowAddStudent(false);
        setSelectedExistingStudentId("");
        fetchStudents(selectedClass.id);
        fetchClasses();
        fetchGlobalStudents();
      } catch (error: any) {
        toast.error(error.message || "Nepodařilo se přiřadit žáka");
      }
      return;
    }

    // New student mode
    if (!newStudentFirst.trim() || !newStudentLast.trim()) {
      toast.error("Vyplňte jméno i příjmení");
      return;
    }

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          firstName: newStudentFirst.trim(),
          lastName: newStudentLast.trim(),
        }),
      });

      if (!res.ok) throw new Error("Přidání žáka selhalo");

      toast.success("Žák byl úspěšně vytvořen a zapsán");
      setNewStudentFirst("");
      setNewStudentLast("");
      setShowAddStudent(false);
      fetchStudents(selectedClass.id);
      fetchClasses();
      fetchGlobalStudents();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se přidat žáka");
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string, studentName: string) => {
    if (!selectedClass) return;
    if (!confirm(`Opravdu chcete odebrat žáka ${studentName} z třídy ${selectedClass.name}? Žák zůstane v celkové databázi.`)) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/students?studentId=${studentId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Odebrání žáka selhalo");

      toast.success(`Žák ${studentName} byl odebrán z třídy`);
      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se odebrat žáka z třídy");
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (!bulkText.trim()) {
      toast.error("Vložte text se jmény žáků");
      return;
    }

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "bulk",
          text: bulkText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hromadný import selhal");

      toast.success(data.message || `Importováno ${data.count} žáků`);
      setBulkText("");
      setShowBulkImport(false);
      fetchStudents(selectedClass.id);
      fetchClasses();
      fetchGlobalStudents();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se importovat žáky");
    }
  };

  // Filter global students available for enrolling into selected class
  const availableGlobalStudents = allGlobalStudents.filter(
    st => !students.some(classStudent => classStudent.id === st.id)
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-500" />
            Třídy a Skupiny
          </h2>
          <p className="text-slate-400 mt-1">Správa třídních kolektivů, barevného odlišení a přiřazování žáků do skupin (N:M).</p>
        </div>
        <button
          onClick={() => setShowAddClass(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition duration-200 shadow-lg shadow-indigo-600/15"
        >
          <Plus className="h-5 w-5" />
          Nová třída
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Classes List */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">
            Seznam tříd / skupin
          </h3>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Načítání tříd...
            </div>
          ) : classes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
              <Users className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-slate-400 text-sm">Žádné třídy nebyly nalezeny.</p>
              <button 
                onClick={() => setShowAddClass(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2 underline"
              >
                Vytvořit první třídu
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {classes.map((cls) => {
                const isSelected = selectedClass?.id === cls.id;
                const classColor = cls.color || "#4f46e5";

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: classColor }}
                      >
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{cls.name}</div>
                        <div className="text-[11px] text-slate-500">{cls.grade}. ročník</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-950/80 text-[10px] text-slate-400 px-2 py-0.5 rounded-full font-mono border border-slate-800/80">
                        {cls._count?.students || 0} žáků
                      </span>
                      <ChevronRight className={`h-4 w-4 text-slate-600 ${isSelected ? "text-indigo-400" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Class Details & Student List */}
        <div className="lg:grid lg:grid-cols-1 lg:col-span-2 h-[calc(100vh-220px)] min-h-[500px]">
          {selectedClass ? (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                      style={{ backgroundColor: selectedClass.color || "#4f46e5" }}
                    />
                    <h3 className="text-2xl font-bold text-white">{selectedClass.name}</h3>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-md">
                      {selectedClass.grade}. ročník
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">ID třídy: <span className="font-mono">{selectedClass.id}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setStudentAddMode("existing");
                      setShowAddStudent(true);
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition"
                  >
                    <UserPlus className="h-4 w-4" />
                    Přiřadit žáka
                  </button>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Hromadný import
                  </button>
                  <button
                    onClick={() => handleDeleteClass(selectedClass.id, selectedClass.name)}
                    className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition"
                    title="Smazat třídu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Student Table */}
              <div className="flex-1 overflow-y-auto mt-6">
                {isStudentsLoading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Načítání seznamu žáků...
                  </div>
                ) : students.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <FolderOpen className="h-12 w-12 text-slate-700 mb-3" />
                    <p className="text-slate-400 text-sm">V této třídě zatím nejsou žádní žáci.</p>
                    <p className="text-slate-500 text-xs mt-1">Použijte tlačítka výše pro přiřazení z databáze nebo import nového seznamu.</p>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-3.5 font-semibold">Pořadí</th>
                          <th className="px-6 py-3.5 font-semibold">Příjmení a jméno</th>
                          <th className="px-6 py-3.5 font-semibold text-right">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {students.map((student, index) => (
                          <tr key={student.id} className="hover:bg-slate-800/20">
                            <td className="px-6 py-3 font-mono text-xs text-slate-500 w-16">{index + 1}.</td>
                            <td className="px-6 py-3 font-medium text-slate-200">
                              <Link 
                                href={`/students?id=${student.id}`} 
                                className="hover:text-indigo-400 transition flex items-center gap-2 group"
                              >
                                <span>{student.lastName} {student.firstName}</span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <button
                                onClick={() => handleRemoveStudentFromClass(student.id, `${student.lastName} ${student.firstName}`)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition flex items-center gap-1 text-xs font-medium ml-auto"
                                title="Odebrat z téhle třídy"
                              >
                                <UserX className="h-4 w-4" />
                                Odebrat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center h-full">
              <Users className="h-16 w-16 text-slate-800 mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">Vyberte nebo vytvořte třídu</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-1">
                Pro zobrazení seznamu žáků a provádění změn vyberte třídu z levého panelu.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Add Class */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative my-8">
            <h4 className="text-lg font-bold text-white mb-4">Vytvořit novou třídu</h4>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Název třídy / skupiny
                </label>
                <input
                  type="text"
                  placeholder="např. 9.A, 7.B - Skupina 2"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-155"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Ročník (kategorie)
                </label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition duration-155"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      {g}. ročník
                    </option>
                  ))}
                </select>
              </div>

              {/* 50 Color Palette Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-400" />
                  Barva třídy (výběr z 50 odstínů)
                </label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 max-h-36 overflow-y-auto grid grid-cols-10 gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewClassColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-6 w-6 rounded-md transition transform hover:scale-110 flex items-center justify-center border ${
                        newClassColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 border-white scale-110" : "border-transparent"
                      }`}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
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

      {/* MODAL: Add / Assign Student */}
      {showAddStudent && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h4 className="text-lg font-bold text-white mb-1">Zapsat / Přiřadit žáka</h4>
            <p className="text-xs text-slate-400 mb-4">Třída: <span className="font-semibold text-indigo-400">{selectedClass.name}</span></p>

            {/* Mode selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 mb-4">
              <button
                type="button"
                onClick={() => setStudentAddMode("existing")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  studentAddMode === "existing"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Vybrat existujícího žáka
              </button>
              <button
                type="button"
                onClick={() => setStudentAddMode("new")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  studentAddMode === "new"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Vytvořit nového žáka
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              {studentAddMode === "existing" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Vyberte žáka z celkové databáze školy
                  </label>
                  {availableGlobalStudents.length === 0 ? (
                    <div className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-900/50">
                      Všichni existující žáci již do této třídy patří, nebo v databázi žádní další žáci nejsou.
                    </div>
                  ) : (
                    <select
                      value={selectedExistingStudentId}
                      onChange={(e) => setSelectedExistingStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                    >
                      <option value="">-- Vyberte žáka --</option>
                      {availableGlobalStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.lastName} {st.firstName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Jméno
                    </label>
                    <input
                      type="text"
                      placeholder="např. Jan"
                      value={newStudentFirst}
                      onChange={(e) => setNewStudentFirst(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-155"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Příjmení
                    </label>
                    <input
                      type="text"
                      placeholder="např. Novák"
                      value={newStudentLast}
                      onChange={(e) => setNewStudentLast(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-155"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  {studentAddMode === "existing" ? "Přiřadit do třídy" : "Vytvořit a zapsat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Import Students */}
      {showBulkImport && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <h4 className="text-lg font-bold text-white mb-1">Hromadný import žáků</h4>
            <p className="text-xs text-slate-400 mb-4">Třída: <span className="font-semibold text-indigo-400">{selectedClass.name}</span></p>
            
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/60 mb-4 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                <Info className="h-4 w-4" />
                <span>Návod k formátu:</span>
              </div>
              <p>Každého žáka vložte na **samostatný řádek**.</p>
              <p>Podporované oddělovače: středník, čárka, tabulátor nebo jen mezera.</p>
              <p className="font-semibold text-slate-300 mt-2">Příklady:</p>
              <pre className="font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-900">
Novák Jan{"\n"}
Svobodová Marie{"\n"}
Novotný, Petr{"\n"}
Černá;Anna
              </pre>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Textové pole pro vložení dat
                </label>
                <textarea
                  rows={8}
                  placeholder="Sem zkopírujte seznam z Excelu, CSV nebo Bakalářů..."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none font-mono transition"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Spustit import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

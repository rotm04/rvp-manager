"use client";

import React, { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { 
  UserCheck, 
  Search, 
  Plus, 
  Trash2, 
  Award, 
  GraduationCap, 
  ClipboardList, 
  CheckCircle2, 
  XCircle,
  BarChart2,
  Calendar,
  Save,
  BookOpen,
  Users
} from "lucide-react";

interface StudentClassType {
  id: string;
  name: string;
  grade: number;
  color?: string;
}

interface StudentBasicType {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  classes: StudentClassType[];
  _count?: {
    assignments: number;
  };
}

interface TaskAssignmentType {
  id: string;
  studentId: string;
  taskId: string;
  submitted: boolean;
  points: number | null;
  grade: string | null;
  feedback: string | null;
  task: {
    id: string;
    title: string;
    description: string;
    maxPoints: number | null;
    maxGrade: string | null;
    dueDate: string | null;
    classId: string;
    class: {
      id: string;
      name: string;
      color?: string;
    };
  };
}

interface StudentProfileType extends StudentBasicType {
  assignments: TaskAssignmentType[];
}

interface ClassStatType {
  classId: string;
  className: string;
  classGrade: number;
  classColor: string;
  stats: {
    gradeAverage: number | null;
    gradeCount: number;
    pointsEarned: number;
    pointsMaxTotal: number;
    pointsAverage: number | null;
    pointsPercentage: number | null;
    submittedCount: number;
    totalCount: number;
  };
  assignments: TaskAssignmentType[];
}

interface OverallStatsType {
  gradeAverage: number | null;
  gradeCount: number;
  pointsEarned: number;
  pointsMaxTotal: number;
  pointsAverage: number | null;
  pointsPercentage: number | null;
  submittedCount: number;
  totalCount: number;
}

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("id");

  const [students, setStudents] = useState<StudentBasicType[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Detailed profile data
  const [profileStudent, setProfileStudent] = useState<StudentProfileType | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStatsType | null>(null);
  const [classStats, setClassStats] = useState<ClassStatType[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Add new global student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");

  // Fetch all students
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch selected student profile detail when selectedStudentId changes
  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProfile(selectedStudentId);
    } else {
      setProfileStudent(null);
      setOverallStats(null);
      setClassStats([]);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Nelze načíst žáky");
      const data = await res.json();
      setStudents(data);
      if (data.length > 0 && !selectedStudentId && !initialStudentId) {
        setSelectedStudentId(data[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || "Chyba při načítání žáků");
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchStudentProfile = async (id: string) => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) throw new Error("Nelze načíst profil žáka");
      const data = await res.json();
      setProfileStudent(data.student);
      setOverallStats(data.overallStats);
      setClassStats(data.classStats);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se načíst profil žáka");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) {
      toast.error("Vyplňte jméno i příjmení");
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim()
        })
      });

      if (!res.ok) throw new Error("Vytvoření žáka selhalo");

      const created = await res.json();
      toast.success(`Žák ${created.lastName} ${created.firstName} byl přidán`);
      setNewFirstName("");
      setNewLastName("");
      setShowAddModal(false);
      
      await fetchStudents();
      setSelectedStudentId(created.id);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se vytvořit žáka");
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Opravdu chcete smazat žáka ${name} z databáze? Vymažou se i jeho výsledky.`)) return;

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Smazání selhalo");

      toast.success(`Žák ${name} byl smazán`);
      setSelectedStudentId(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se smazat žáka");
    }
  };

  const filteredStudents = students.filter(st => {
    const fullName = `${st.lastName} ${st.firstName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-indigo-500" />
            Karta žáků & Profily
          </h2>
          <p className="text-slate-400 mt-1">
            Přehled souhrnných výsledků, známkových průměrů po třídách i celkově a odevzdaných úkolů.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition duration-200 shadow-lg shadow-indigo-600/15 self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" />
          Přidat žáka do databáze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Student Directory */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          
          {/* Search box */}
          <div className="relative mb-4">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Hledat žáka podle jména..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <h3 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
            Seznam žáků ({filteredStudents.length})
          </h3>

          {isLoadingList ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Načítání...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-800 rounded-xl">
              <UserCheck className="h-10 w-10 text-slate-800 mb-2" />
              <p className="text-slate-500 text-xs">Nenalezeni žádní žáci</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredStudents.map((st) => {
                const isSelected = selectedStudentId === st.id;

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition border ${
                      isSelected
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="font-bold text-sm">{st.lastName} {st.firstName}</div>
                    
                    {/* Class badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {st.classes && st.classes.length > 0 ? (
                        st.classes.map(c => (
                          <span
                            key={c.id}
                            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wider uppercase"
                            style={{ backgroundColor: c.color || "#4f46e5" }}
                          >
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Bez přiřazené třídy</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Student Profile & Performance Details */}
        <div className="lg:col-span-2 h-[calc(100vh-220px)] min-h-[500px]">
          {isLoadingProfile ? (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 h-full flex items-center justify-center text-slate-400 text-sm">
              Načítání výsledků žáka...
            </div>
          ) : profileStudent && overallStats ? (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col h-full overflow-y-auto space-y-6">
              
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {profileStudent.lastName} {profileStudent.firstName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {profileStudent.classes.map(c => (
                      <span
                        key={c.id}
                        className="text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{ backgroundColor: c.color || "#4f46e5" }}
                      >
                        {c.name} ({c.grade}. ročník)
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteStudent(profileStudent.id, `${profileStudent.lastName} ${profileStudent.firstName}`)}
                  className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-950 transition flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Smazat z databáze
                </button>
              </div>

              {/* OVERALL SUMMARY KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Overall Grade Average Card */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Celkový průměr</div>
                    <div className="text-2xl font-black text-white mt-0.5">
                      {overallStats.gradeAverage !== null ? overallStats.gradeAverage.toFixed(2) : "—"}
                    </div>
                    <div className="text-[10px] text-slate-500">{overallStats.gradeCount} hodnocených úkolů</div>
                  </div>
                </div>

                {/* Overall Points Performance Card */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bodový průměr</div>
                    <div className="text-2xl font-black text-white mt-0.5">
                      {overallStats.pointsAverage !== null ? `${overallStats.pointsAverage} b.` : "—"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {overallStats.pointsPercentage !== null ? `Úspěšnost: ${overallStats.pointsPercentage}%` : "Zatím bez bodů"}
                    </div>
                  </div>
                </div>

                {/* Submissions Count Card */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Odevzdáno úkolů</div>
                    <div className="text-2xl font-black text-white mt-0.5">
                      {overallStats.submittedCount} / {overallStats.totalCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Aktivita v kurzu</div>
                  </div>
                </div>
              </div>

              {/* PER-CLASS AVERAGES BREAKDOWN */}
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-400" />
                  Průměry podle jednotlivých tříd a skupin
                </h4>

                {classStats.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    Žák zatím není přiřazen do žádné třídy.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {classStats.map(cs => (
                      <div 
                        key={cs.classId} 
                        className="bg-slate-950/50 border rounded-xl p-4 flex justify-between items-center"
                        style={{ borderColor: `${cs.classColor}50` }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-8 rounded-full" 
                            style={{ backgroundColor: cs.classColor }} 
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-200">{cs.className}</div>
                            <div className="text-[10px] text-slate-500">{cs.classGrade}. ročník</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-amber-400">
                            {cs.stats.gradeAverage !== null ? `Průměr známek: ${cs.stats.gradeAverage}` : "Známky: —"}
                          </div>
                          <div className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                            {cs.stats.pointsAverage !== null ? `Body: ${cs.stats.pointsAverage} b.` : "Body: —"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMISSIONS & TASK RESULTS LIST */}
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-400" />
                  Přehled odevzdaných a zadaných úkolů
                </h4>

                {profileStudent.assignments.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center py-8">
                    Pro tohoto žáka zatím nebyly evidovány žádné zadané úkoly.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Třída</th>
                          <th className="px-4 py-3 font-semibold">Úkol</th>
                          <th className="px-4 py-3 font-semibold">Stav</th>
                          <th className="px-4 py-3 font-semibold">Hodnocení</th>
                          <th className="px-4 py-3 font-semibold">Poznámka vyučujícího</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {profileStudent.assignments.map((asg) => (
                          <tr key={asg.id} className="hover:bg-slate-900/40 transition">
                            <td className="px-4 py-3">
                              <span 
                                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wider uppercase"
                                style={{ backgroundColor: asg.task.class.color || "#4f46e5" }}
                              >
                                {asg.task.class.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-200">
                              {asg.task.title}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {asg.submitted ? (
                                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Odevzdáno
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                                  <XCircle className="h-3.5 w-3.5" /> Neodevzdáno
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-amber-400">
                              {asg.grade ? `Známka: ${asg.grade}` : asg.points !== null ? `${asg.points} b.` : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-[11px] italic">
                              {asg.feedback || "Bez poznámky"}
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
              <UserCheck className="h-16 w-16 text-slate-800 mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">Vyberte žáka</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-1">
                Vyberte žáka ze seznamu vlevo pro zobrazení jeho souhrnného profilu, známkových průměrů a úkolů.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Add Global Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h4 className="text-lg font-bold text-white mb-4">Přidat nového žáka do databáze</h4>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Jméno *
                </label>
                <input
                  type="text"
                  placeholder="např. Jan"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Příjmení *
                </label>
                <input
                  type="text"
                  placeholder="např. Novák"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Uložit žáka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Načítání profilů žáků...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}

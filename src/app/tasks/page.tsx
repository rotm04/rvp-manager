"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  FileText, 
  Award, 
  ChevronDown,
  FolderOpen,
  Info,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Save,
  Check
} from "lucide-react";

interface ClassType {
  id: string;
  name: string;
  grade: number;
}

interface TaskType {
  id: string;
  classId: string;
  class: {
    name: string;
  };
  title: string;
  description: string;
  maxPoints: number | null;
  maxGrade: string | null;
  filePlaceholder: string | null;
  datumZadani: string;
  dueDate: string | null;
  createdAt: string;
}

interface StudentSubmissionType {
  studentId: string;
  firstName: string;
  lastName: string;
  submitted: boolean;
  points: number | null;
  grade: string | null;
  feedback: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // Modals & form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);

  // Student Grading Modal State
  const [gradingTask, setGradingTask] = useState<TaskType | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmissionType[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  // Task Form States (Add/Edit)
  const [taskClassId, setTaskClassId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskGradingType, setTaskGradingType] = useState<"points" | "grade">("points");
  const [taskMaxPoints, setTaskMaxPoints] = useState("10");
  const [taskMaxGrade, setTaskMaxGrade] = useState("1-5");
  const [taskFilePlaceholder, setTaskFilePlaceholder] = useState("");
  const [taskDatumZadani, setTaskDatumZadani] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  useEffect(() => {
    fetchTasks();
    fetchClasses();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Nelze načíst úkoly");
      const data = await res.json();
      setTasks(data);
    } catch (error: any) {
      toast.error(error.message || "Chyba při načítání úkolů");
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
        setTaskClassId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch classes");
    }
  };

  const handleOpenAdd = () => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskGradingType("points");
    setTaskMaxPoints("10");
    setTaskMaxGrade("1-5");
    setTaskFilePlaceholder("");
    const today = new Date().toISOString().split("T")[0];
    setTaskDatumZadani(today);
    setTaskDueDate("");
    
    setEditingTask(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (task: TaskType) => {
    setEditingTask(task);
    setTaskClassId(task.classId);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    
    if (task.maxPoints !== null) {
      setTaskGradingType("points");
      setTaskMaxPoints(String(task.maxPoints));
    } else {
      setTaskGradingType("grade");
      setTaskMaxGrade(task.maxGrade || "1-5");
    }
    
    setTaskFilePlaceholder(task.filePlaceholder || "");
    
    const assignedStr = task.datumZadani ? new Date(task.datumZadani).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    setTaskDatumZadani(assignedStr);
    
    const dueStr = task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "";
    setTaskDueDate(dueStr);
    
    setShowAddModal(true);
  };

  // Open Grading Table for a task
  const handleOpenGrading = async (task: TaskType) => {
    setGradingTask(task);
    setIsSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/submissions`);
      if (!res.ok) throw new Error("Nelze načíst žáky pro tento úkol");
      const data = await res.json();
      setSubmissions(data);
    } catch (error: any) {
      toast.error(error.message || "Chyba při načítání hodnocení žáků");
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  // Local state update for a student submission row
  const updateSubmissionRow = (studentId: string, fields: Partial<StudentSubmissionType>) => {
    setSubmissions(prev => prev.map(s => s.studentId === studentId ? { ...s, ...fields } : s));
  };

  // Helper validation for grade range
  const isValidGradeValue = (val: string | null | undefined): boolean => {
    if (!val || val.trim() === "") return true;
    const normalized = val.replace(",", ".");
    const num = parseFloat(normalized);
    return !isNaN(num) && num >= 1 && num <= 5;
  };

  // Save single student evaluation
  const handleSaveStudentEvaluation = async (studentId: string) => {
    if (!gradingTask) return;
    const sub = submissions.find(s => s.studentId === studentId);
    if (!sub) return;

    if (gradingTask.maxGrade && !isValidGradeValue(sub.grade)) {
      toast.error(`Známka pro ${sub.lastName} ${sub.firstName} musí být v rozmezí 1 až 5 (např. 1, 1.5, 2.5)`);
      return;
    }

    setSavingStudentId(studentId);
    try {
      const res = await fetch(`/api/tasks/${gradingTask.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: sub.studentId,
          submitted: sub.submitted,
          points: sub.points,
          grade: sub.grade,
          feedback: sub.feedback
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Uložení selhalo");
      toast.success(`Hodnocení pro ${sub.lastName} ${sub.firstName} bylo uloženo`);
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se uložit hodnocení");
    } finally {
      setSavingStudentId(null);
    }
  };

  // Save all student evaluations
  const handleSaveAllEvaluations = async () => {
    if (!gradingTask) return;

    // Validate grades first
    if (gradingTask.maxGrade) {
      for (const sub of submissions) {
        if (!isValidGradeValue(sub.grade)) {
          toast.error(`Chybná známka u žáka ${sub.lastName} ${sub.firstName}! Známka musí být 1 až 5.`);
          return;
        }
      }
    }

    toast.loading("Ukládám hodnocení všech žáků...", { id: "saveAll" });

    try {
      await Promise.all(
        submissions.map(sub => 
          fetch(`/api/tasks/${gradingTask.id}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: sub.studentId,
              submitted: sub.submitted,
              points: sub.points,
              grade: sub.grade,
              feedback: sub.feedback
            })
          })
        )
      );

      toast.success("Všechna hodnocení byla úspěšně uložena!", { id: "saveAll" });
    } catch (error: any) {
      toast.error("Některá hodnocení se nepodařilo uložit", { id: "saveAll" });
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskClassId || !taskTitle.trim() || !taskDesc.trim()) {
      toast.error("Vyplňte název, popis a zvolte třídu");
      return;
    }

    const assignDate = new Date(taskDatumZadani);
    if (taskDueDate) {
      const dueDateVal = new Date(taskDueDate);
      if (dueDateVal.getTime() < assignDate.getTime()) {
        toast.error("Termín odevzdání (deadline) nesmí předcházet datu zadání.");
        return;
      }
    }

    const payload = {
      classId: taskClassId,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      maxPoints: taskGradingType === "points" ? parseInt(taskMaxPoints, 10) : null,
      maxGrade: taskGradingType === "grade" ? taskMaxGrade : null,
      filePlaceholder: taskFilePlaceholder.trim() || null,
      datumZadani: new Date(taskDatumZadani).toISOString(),
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null
    };

    try {
      let res;
      if (editingTask) {
        res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Uložení úkolu selhalo");

      toast.success(editingTask ? "Úkol byl úspěšně upraven" : "Nový úkol byl zadán");
      setShowAddModal(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se uložit úkol");
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Opravdu chcete smazat úkol "${title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Smazání úkolu selhalo");

      toast.success(`Úkol "${title}" byl smazán`);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Nepodařilo se smazat úkol");
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (selectedClassFilter === "all") return true;
    return t.classId === selectedClassFilter;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-indigo-500" />
            Úkoly a hodnocení žáků
          </h2>
          <p className="text-slate-400 mt-1">
            Zadávání úkolů, evidence odevzdání a hodnocení žáků jednotlivých tříd.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition duration-200 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-5 w-5" />
            Zadat úkol
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          Načítání zadaných úkolů...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center">
          <ClipboardList className="h-16 w-16 text-slate-850 mb-3" />
          <h3 className="text-lg font-semibold text-slate-400">Žádné úkoly</h3>
          <p className="text-slate-500 text-sm max-w-xs mt-1">
            Zatím nebyly zadány žádné úkoly. Klikněte na tlačítko "Zadat úkol" pro zadání prvního cvičení.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTasks.map((task) => {
            const isPoints = task.maxPoints !== null;
            const hasDueDate = task.dueDate !== null;
            const due = hasDueDate ? new Date(task.dueDate!) : null;
            const isOverdue = due ? due.getTime() < Date.now() : false;
            
            const assigned = task.datumZadani ? new Date(task.datumZadani) : new Date(task.createdAt);

            return (
              <div
                key={task.id}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Task Header */}
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-950/80 border border-indigo-900/80 text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {task.class.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Zadáno: {assigned.toLocaleDateString("cs-CZ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-950/80 transition"
                        title="Upravit úkol"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-950/80 transition"
                        title="Smazat úkol"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="font-extrabold text-slate-100 text-lg mb-2">{task.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">{task.description}</p>
                </div>

                {/* Task Details Row & Grading Trigger */}
                <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                  {task.filePlaceholder && (
                    <div className="flex items-center gap-2.5 text-slate-400 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span className="truncate">Očekávaný soubor / Podklady: <strong className="text-slate-200">{task.filePlaceholder}</strong></span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span>
                        {isPoints 
                          ? `Hodnocení: Max. ${task.maxPoints} bodů` 
                          : `Hodnocení známkou (1–5)`}
                      </span>
                    </div>

                    {hasDueDate && due && (
                      <div className={`flex items-center gap-1.5 font-bold ${
                        isOverdue ? "text-rose-400" : "text-slate-400"
                      }`}>
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        <span>
                          Termín: {due.toLocaleDateString("cs-CZ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BUTTON TO OPEN STUDENT GRADING MODAL */}
                  <button
                    onClick={() => handleOpenGrading(task)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold text-xs py-2.5 rounded-xl transition duration-155"
                  >
                    <Users className="h-4 w-4" />
                    <span>Hodnocení žáků ({task.class.name})</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Student Grading Table */}
      {gradingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative my-6 sm:my-10">
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-indigo-950 text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                    {gradingTask.class.name}
                  </span>
                  <h4 className="text-xl font-bold text-white">Hodnocení úkolu: {gradingTask.title}</h4>
                </div>
                <p className="text-xs text-slate-400">
                  {gradingTask.maxPoints !== null 
                    ? `Způsob hodnocení: Body (max ${gradingTask.maxPoints})` 
                    : `Způsob hodnocení: Známka (povoleno 1 až 5, např. 1.5, 2)`}
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setGradingTask(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Zavřít
              </button>
            </div>

            {/* Submissions Table */}
            {isSubmissionsLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Načítání seznamu žáků...</div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">V této třídě zatím nejsou zapsaní žádní žáci.</div>
            ) : (
              <div className="space-y-4">
                <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/40 max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Žák</th>
                        <th className="px-4 py-3 font-semibold w-32">Stav odevzdání</th>
                        <th className="px-4 py-3 font-semibold w-36">Hodnocení</th>
                        <th className="px-4 py-3 font-semibold">Poznámka / Připomínka</th>
                        <th className="px-4 py-3 font-semibold w-24 text-right">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {submissions.map((sub) => {
                        const isSaving = savingStudentId === sub.studentId;

                        return (
                          <tr key={sub.studentId} className="hover:bg-slate-900/40 transition">
                            {/* Student Name */}
                            <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                              {sub.lastName} {sub.firstName}
                            </td>

                            {/* Submitted Checkbox */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sub.submitted}
                                  onChange={(e) => updateSubmissionRow(sub.studentId, { submitted: e.target.checked })}
                                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className={`text-[11px] font-semibold ${
                                  sub.submitted ? "text-emerald-400" : "text-slate-500"
                                }`}>
                                  {sub.submitted ? "Odevzdáno" : "Neodevzdáno"}
                                </span>
                              </label>
                            </td>

                            {/* Evaluation (Points or Grade) */}
                            <td className="px-4 py-3">
                              {gradingTask.maxPoints !== null ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={gradingTask.maxPoints}
                                    placeholder="body"
                                    value={sub.points !== null ? sub.points : ""}
                                    onChange={(e) => updateSubmissionRow(sub.studentId, { points: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                                    className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-500">/ {gradingTask.maxPoints} b.</span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="známka (1-5)"
                                  value={sub.grade || ""}
                                  onChange={(e) => updateSubmissionRow(sub.studentId, { grade: e.target.value })}
                                  className="w-24 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                                />
                              )}
                            </td>

                            {/* Teacher Feedback Note */}
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Stručná poznámka pro žáka..."
                                value={sub.feedback || ""}
                                onChange={(e) => updateSubmissionRow(sub.studentId, { feedback: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                              />
                            </td>

                            {/* Inline Save Row */}
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveStudentEvaluation(sub.studentId)}
                                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 p-1.5 rounded-lg border border-indigo-500/30 transition duration-155 disabled:opacity-50"
                                title="Uložit tomuto žákovi"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Batch Save Button */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500">
                    Celkem žáků: <strong className="text-slate-300">{submissions.length}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveAllEvaluations}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/15"
                  >
                    <Check className="h-4 w-4" />
                    <span>Uložit hodnocení všech žáků</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative my-6 sm:my-10">
            <h4 className="text-lg font-bold text-white mb-4">
              {editingTask ? "Upravit domácí úkol" : "Zadat nový domácí úkol"}
            </h4>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Třída / Skupina *
                </label>
                <select
                  value={taskClassId}
                  onChange={(e) => setTaskClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition duration-155"
                  disabled={!!editingTask}
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
                  Název úkolu *
                </label>
                <input
                  type="text"
                  placeholder="např. Naprogramování kalkulačky v Pythonu"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-655 focus:outline-none transition duration-155"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Zadání / Popis úkolu *
                </label>
                <textarea
                  rows={3}
                  placeholder="Popište, co mají žáci vypracovat a jaká jsou kritéria..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-655 focus:outline-none transition"
                  required
                />
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 space-y-3">
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
                  Způsob hodnocení
                </label>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-355 cursor-pointer">
                    <input
                      type="radio"
                      name="gradingType"
                      checked={taskGradingType === "points"}
                      onChange={() => setTaskGradingType("points")}
                      className="h-4 w-4 bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-650"
                    />
                    Body
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-355 cursor-pointer">
                    <input
                      type="radio"
                      name="gradingType"
                      checked={taskGradingType === "grade"}
                      onChange={() => setTaskGradingType("grade")}
                      className="h-4 w-4 bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-650"
                    />
                    Známka (1–5)
                  </label>
                </div>

                {taskGradingType === "points" ? (
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Maximální počet bodů
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={taskMaxPoints}
                      onChange={(e) => setTaskMaxPoints(e.target.value)}
                      className="w-32 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Stupnice známek
                    </label>
                    <input
                      type="text"
                      value="1-5 (povolena desetinná)"
                      disabled
                      className="w-48 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Odkaz na podklady / Název očekávaného souboru
                </label>
                <p className="text-[10px] text-slate-500 leading-normal mb-2">
                  Zde zadejte název souboru, který mají žáci odevzdat (např. kalkulacka.py), nebo vložte odkaz na OneDrive/Disk.
                </p>
                <input
                  type="text"
                  placeholder="např. kalkulacka.py nebo odkaz na OneDrive"
                  value={taskFilePlaceholder}
                  onChange={(e) => setTaskFilePlaceholder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-205 placeholder-slate-655 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Datum zadání
                  </label>
                  <input
                    type="date"
                    value={taskDatumZadani}
                    onChange={(e) => setTaskDatumZadani(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-250 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Termín odevzdání (Due Date)
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-250 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTask(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/10"
                >
                  {editingTask ? "Uložit změny" : "Uložit a zadat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

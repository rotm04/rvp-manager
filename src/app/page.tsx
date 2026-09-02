"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles
} from "lucide-react";

interface LessonType {
  id: string;
  class: {
    name: string;
  };
  date: string;
  topic: string;
  description: string;
}

interface StatsType {
  classCount: number;
  studentCount: number;
  curriculumCount: number;
  taskCount: number;
  upcomingLessons: LessonType[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard statistics", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/20 p-8 md:p-10 mb-8 shadow-xl shadow-indigo-650/5">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest flex items-center gap-1.5 w-fit mb-4">
            <Sparkles className="h-3 w-3" /> Portál učitele
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Vítej v systému <span className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">RVP Manager</span>
          </h2>
          <p className="text-slate-350 text-sm md:text-base mt-2 max-w-lg leading-relaxed">
            Plánuj výuku, eviduj žáky, propojuj vyučovací hodiny s očekávanými výstupy RVP a zadávej úkoly z jednoho přehledného místa.
          </p>
        </div>
        
        {/* Glow decorative spheres */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          Načítání přehledu...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat Card: Classes */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-indigo-600/10 p-2.5 rounded-xl text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Třídy a skupiny</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">{stats?.classCount || 0}</div>
            </div>

            {/* Stat Card: Students */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-emerald-600/10 p-2.5 rounded-xl text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Aktivní žáci</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">{stats?.studentCount || 0}</div>
            </div>

            {/* Stat Card: Curriculum */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-cyan-600/10 p-2.5 rounded-xl text-cyan-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-slate-450 text-xs font-semibold uppercase tracking-wider">Témata RVP</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">{stats?.curriculumCount || 0}</div>
            </div>

            {/* Stat Card: Tasks */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-amber-600/10 p-2.5 rounded-xl text-amber-400">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-slate-450 text-xs font-semibold uppercase tracking-wider">Zadané úkoly</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">{stats?.taskCount || 0}</div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming lessons list */}
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-400" />
                Nadcházející výukové hodiny
              </h3>
              
              {stats?.upcomingLessons.length === 0 ? (
                <div className="flex-1 border border-dashed border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center text-slate-500">
                  <Clock className="h-10 w-10 mb-2 text-slate-800" />
                  <p className="text-sm">Žádné nadcházející hodiny nebyly vygenerovány.</p>
                  <Link 
                    href="/lessons" 
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline mt-1.5"
                  >
                    Naplánovat první hodinu
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5 flex-1">
                  {stats?.upcomingLessons.map((lesson) => {
                    const d = new Date(lesson.date);
                    return (
                      <div 
                        key={lesson.id} 
                        className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-800 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-slate-900 border border-slate-800 text-[10px] text-slate-450 font-bold uppercase tracking-wider p-2 rounded-lg text-center flex flex-col items-center justify-center min-w-[55px]">
                            <span>{d.getDate()}</span>
                            <span>{d.toLocaleDateString("cs-CZ", { month: "short" })}</span>
                          </div>
                          <div>
                            <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                              Třída {lesson.class.name}
                            </span>
                            <h4 className="font-bold text-slate-200 text-sm mt-1">{lesson.topic}</h4>
                            <p className="text-slate-450 text-[11px] mt-0.5 line-clamp-1">{lesson.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold sm:self-center">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 text-right">
                    <Link
                      href="/lessons"
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 justify-end"
                    >
                      Zobrazit celý rozvrh <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick links & tips */}
            <div className="space-y-6">
              {/* Quick actions box */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">Rychlé akce</h3>
                <div className="space-y-2.5">
                  <Link 
                    href="/classes" 
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:bg-slate-850/30 text-xs font-semibold text-slate-300 transition"
                  >
                    <span>Importovat seznam žáků</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </Link>
                  <Link 
                    href="/curriculum" 
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:bg-slate-850/30 text-xs font-semibold text-slate-300 transition"
                  >
                    <span>Připravit tematické plány</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </Link>
                  <Link 
                    href="/lessons" 
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:bg-slate-850/30 text-xs font-semibold text-slate-300 transition"
                  >
                    <span>Generovat vyučovací hodiny</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </Link>
                  <Link 
                    href="/tasks" 
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:bg-slate-850/30 text-xs font-semibold text-slate-300 transition"
                  >
                    <span>Zadat domácí cvičení</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </Link>
                </div>
              </div>

              {/* Curriculum Hint Card */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Metodický tip RVP</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provázáním každé vyučovací hodiny s tematickým plánem splníte legislativní požadavky na evidenci očekávaných výstupů učení (OVU), rozvoj gramotností a klíčových kompetencí žáků. Změny v kódech konkrétních hodin neovlivní výchozí plán.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

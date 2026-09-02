"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  BookOpen, 
  Calendar, 
  ClipboardList,
  GraduationCap,
  Code2
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Nástěnka", href: "/", icon: LayoutDashboard },
    { name: "Třídy & Skupiny", href: "/classes", icon: Users },
    { name: "Profily žáků", href: "/students", icon: UserCheck },
    { name: "Tematické plány", href: "/curriculum", icon: BookOpen },
    { name: "Číselníky RVP", href: "/rvp-codes", icon: Code2 },
    { name: "Výukové hodiny", href: "/lessons", icon: Calendar },
    { name: "Úkoly", href: "/tasks", icon: ClipboardList },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 h-screen sticky top-0 shrink-0">
      {/* Brand Logo / Title */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            RVP Manager
          </h1>
          <p className="text-xs text-slate-400">Předmět: Informatika</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Icon 
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                }`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
            UC
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">Portál učitele</p>
            <p className="text-[10px] text-slate-500">Běží lokálně (SQLite)</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

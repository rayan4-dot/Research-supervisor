"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  projectStatus?: string;
}

const tabs = [
  { id: "idea", name: "Idea Builder", icon: "🧩" },
  { id: "structure", name: "Structure", icon: "📚" },
  { id: "methodology", name: "Methodology", icon: "🧪" },
  { id: "review", name: "Supervisor Review", icon: "📝" },
];

export default function Sidebar({ activeTab, onTabChange, projectStatus }: SidebarProps) {
  const statusColor =
    projectStatus === 'completed' ? 'bg-green-500' :
    projectStatus === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400';

  return (
    <aside className="w-full md:w-64 shrink-0">
      {/* Status Badge */}
      {projectStatus && (
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-medium capitalize opacity-60">{projectStatus?.replace('_', ' ')}</span>
        </div>
      )}

      <nav className="flex flex-col gap-1 sticky top-24">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`group text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 relative ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "hover:bg-slate-100 dark:hover:bg-slate-800/60 opacity-70 hover:opacity-100"
            }`}
          >
            {/* Step Number Indicator */}
            <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
              activeTab === tab.id
                ? "bg-white text-primary border-primary shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
            }`}>
              {index + 1}
            </div>
            
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.name}</span>
            {activeTab === tab.id && <span className="ml-auto">→</span>}
          </button>
        ))}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm opacity-50 hover:opacity-100 transition-opacity"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>
    </aside>
  );
}

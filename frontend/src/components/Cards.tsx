"use client";

import Link from "next/link";
import type { Project } from "@/models";
import { getStatusColor, getStatusLabel, formatDate } from "@/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/project/${project.id}`}
      className="block glass-panel p-5 rounded-xl transition-all duration-200 border border-transparent hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-base truncate flex-1">
          {project.title === "Untitled Research" ? project.research_topic : project.title}
        </h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${getStatusColor(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>
      <p className="text-sm opacity-50 truncate mb-3">{project.research_topic}</p>
      <p className="text-xs opacity-40">{formatDate(project.created_at)}</p>
    </Link>
  );
}

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
}

export function StatsCard({ icon, label, value }: StatsCardProps) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs opacity-50">{label}</p>
        <p className="font-bold text-lg">{value}</p>
      </div>
    </div>
  );
}

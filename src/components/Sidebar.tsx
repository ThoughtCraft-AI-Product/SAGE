import React, { useState } from "react";
import { Notebook, Collaborator, EmailLog } from "../types";
import { MessageSquare, Plus, Trash2, Mail, Users, Compass, Shield, Activity, RefreshCw, X } from "lucide-react";

interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onAddNotebook: () => void;
  onDeleteNotebook: (id: string) => void;
  collaborators: Collaborator[];
  emailHistory: EmailLog[];
  showHistory: boolean;
  onToggleHistory: () => void;
  onAddCollaborator: (collaborator: Collaborator) => void;
}

export default function Sidebar({
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onAddNotebook,
  onDeleteNotebook,
  collaborators,
  emailHistory,
  showHistory,
  onToggleHistory,
  onAddCollaborator,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>("");
  const [newColEmail, setNewColEmail] = useState<string>("");
  const [newColRole, setNewColRole] = useState<string>("");

  const handleAddCollaboratorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !newColEmail.trim()) return;
    const initials = newColName.trim().split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const colors = ["emerald", "amber", "cyan", "rose", "indigo"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCol: Collaborator = {
      id: "col_" + Math.random().toString(36).substr(2, 9),
      name: newColName.trim(),
      email: newColEmail.trim(),
      role: newColRole.trim() || "Co-Founder",
      avatar: initials || "CF",
      color: randomColor,
      active: true
    };
    onAddCollaborator(newCol);
    setNewColName("");
    setNewColEmail("");
    setNewColRole("");
    setShowAddForm(false);
  };

  return (
    <div className="w-72 bg-[#F7F8FA] text-slate-800 flex flex-col h-full border-r border-slate-200" id="sidebar_root">
      {/* Workspace Logo / Branding */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center font-black font-sans text-white text-sm shadow-premium">
            S
          </div>
          <div>
            <h1 className="font-sans font-bold text-sm tracking-tight text-slate-900 leading-none">
              Sage Workspace
            </h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-1">
              Leadership Collaborative
            </p>
          </div>
        </div>

        <button
          onClick={onAddNotebook}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl transition-all duration-200 border border-slate-200 shadow-2xs hover:shadow-sm cursor-pointer"
          title="New Brainstorm Board"
          id="add_notebook_sidebar_button"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation tabs or search */}
      <div className="px-4 py-3 border-b border-slate-100">
        <input
          type="text"
          placeholder="Search brainstorm boards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono transition-all duration-200"
        />
      </div>

      {/* Conversations / Notebooks Section */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Brainstorm Boards ({notebooks.length})
          </span>
        </div>

        {notebooks
          .filter((nb) => nb.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((nb) => {
            const isActive = nb.id === activeNotebookId;
            return (
              <div
                key={nb.id}
                onClick={() => onSelectNotebook(nb.id)}
                className={`group flex items-center justify-between px-3.5 py-3 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-slate-100/80 text-slate-950 border-l-2 border-slate-900 font-semibold rounded-r-xl shadow-premium"
                    : "border border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl"
                }`}
                id={`sidebar_notebook_item_${nb.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                  <div className="truncate text-xs font-semibold leading-tight">{nb.title}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotebook(nb.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 rounded transition duration-150 shrink-0 cursor-pointer"
                  title="Delete brainstorm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
      </div>

      {/* Section: Live Collaborators Monitor */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-slate-800 animate-pulse" />
            Live Collaborators ({collaborators.filter(c => c.active).length})
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] font-bold uppercase font-mono text-slate-600 hover:text-slate-900 transition-all duration-200 tracking-wider cursor-pointer"
            id="sidebar_invite_partner_button"
          >
            {showAddForm ? "Cancel" : "+ Invite"}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCollaboratorSubmit} className="mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-premium space-y-3 text-xs animate-slide-up">
            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 font-semibold mb-0.5">Name</label>
              <input
                type="text"
                required
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 mt-0.5 focus:outline-none focus:border-slate-400 transition-all duration-200 font-sans"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 font-semibold mb-0.5">Email</label>
              <input
                type="email"
                required
                value={newColEmail}
                onChange={(e) => setNewColEmail(e.target.value)}
                placeholder="partner@domain.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 mt-0.5 focus:outline-none focus:border-slate-400 transition-all duration-200 font-sans"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 font-semibold mb-0.5">Role</label>
              <input
                type="text"
                value={newColRole}
                onChange={(e) => setNewColRole(e.target.value)}
                placeholder="e.g. Co-Founder"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 mt-0.5 focus:outline-none focus:border-slate-400 transition-all duration-200 font-sans"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
            >
              Add Partner
            </button>
          </form>
        )}

        <div className="space-y-2 mt-2">
          {collaborators.map((col) => {
            const borderClass = col.active ? "border-slate-200 bg-white shadow-premium" : "border-slate-100 opacity-40 bg-slate-50/50";
            return (
              <div
                key={col.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition ${borderClass}`}
                title={`${col.name} - ${col.role} (${col.active ? 'Active Now' : 'Offline'})`}
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold font-mono text-xs text-slate-750 border border-slate-200">
                    {col.avatar}
                  </div>
                  {col.active && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate leading-tight">{col.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">{col.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Removed Outbox / Dispatch Log History Drawer Toggle per user request */}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import NoteEditor from "./components/NoteEditor";
import JarvisAnalytics from "./components/JarvisAnalytics";
import ShareModal from "./components/ShareModal";
import EmailHistoryList from "./components/EmailHistoryList";
import { CO_FOUNDERS, INITIAL_NOTEBOOKS } from "./data/mockData";
import { Notebook, JarvisInsight, EmailLog, Collaborator } from "./types";
import { speakText, stopSpeaking } from "./utils/speechUtils";
import { Sparkles, Info, Users, AlertCircle, Share2, HelpCircle, Activity, Play, Pause, Square } from "lucide-react";

// Default initial analytics for the first notebook
const INITIAL_ANALYTICS_NB1: JarvisInsight = {
  shortResponse: "Focus on Surat sourcing consortium first, but prioritize warehouse automation near Chennai ports to lock down the targeted 50% cost reduction for new clothing product line in India.",
  summary: "Executing the South Asia supply chain and manufacturing blueprint, combining Surat raw sourcing with automated warehousing near Chennai to realize a 50% operational cost saving.",
  actionItems: [
    { task: "Initiate dialogue with fabric manufacturing guilds in Surat", assignee: "@Himanshi Kalra", priority: "High" },
    { task: "Design layout blueprint for automated warehouses near Chennai", assignee: "Product Team", priority: "High" },
    { task: "Audit inter-state customs regulations and subsidy opportunities", assignee: "Operations Lead", priority: "Medium" }
  ],
  risks: [
    "Regional warehouse tax incentives are scheduled for legislative revision in Q4.",
    "Port congestions in South India could extend logistics latency by up to 8 working days."
  ],
  changingFactors: [
    "Volatility in Indian Raw Cotton Index directly impact fabric procurement margins.",
    "Bilateral logistics corridors between Surat and Chennai hubs."
  ],
  decisionAnalytics: [
    { metric: "India Sourcing Cost Savings", value: "50%", context: "for clothing product line in India" },
    { metric: "Warehouse Handling Overhead", value: "-20%", context: "near Chennai ports" },
    { metric: "Regional Middlemen Squeeze", value: "-35%", context: "for local supply networks" }
  ],
  swot: {
    strengths: [
      "Direct connections with local fabric producers in Surat region",
      "Robust core design engine optimized for rapid iterations"
    ],
    weaknesses: [
      "Heavy manual warehouse handling costs in southern distribution ports",
      "Complex custom procedures for regional shipping duties"
    ],
    opportunities: [
      "Secure 50% material savings via direct sourcing partnerships",
      "Leverage Q4 manufacturing and environmental green initiatives"
    ],
    threats: [
      "Sourcing margin volatility from cotton commodity index swings",
      "Short-term operational delays during port transport transitions"
    ]
  },
  proactiveInsight: "Nobody's assigned a dedicated owner to the Chennai warehouse automation track yet — want me to draft a role profile or suggest someone?"
};

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    const saved = localStorage.getItem("aurelius_notebooks");
    return saved ? JSON.parse(saved) : INITIAL_NOTEBOOKS;
  });
  const [activeNotebookId, setActiveNotebookId] = useState<string>(() => {
    const savedId = localStorage.getItem("aurelius_active_notebook_id");
    if (savedId) return savedId;
    const saved = localStorage.getItem("aurelius_notebooks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return INITIAL_NOTEBOOKS[0].id;
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem("aurelius_collaborators");
    return saved ? JSON.parse(saved) : CO_FOUNDERS;
  });
  
  // App state
  const [insight, setInsight] = useState<JarvisInsight | null>(INITIAL_ANALYTICS_NB1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState<boolean>(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [emailHistory, setEmailHistory] = useState<EmailLog[]>([]);

  // Active block tracking for sync merge
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const activeBlockIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    activeBlockIdRef.current = activeBlockId;
  }, [activeBlockId]);

  // Speech feedback state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Autopilot simulation of other founders editing/typing in real-time
  const [isAutopilotOn, setIsAutopilotOn] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationIndicator, setSimulationIndicator] = useState<string | null>(null);

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId) || notebooks[0];

  // Helper: Post state update to sync endpoint
  const postSyncState = async (updatedNotebooks: Notebook[], updatedCollaborators: Collaborator[]) => {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebooks: updatedNotebooks, collaborators: updatedCollaborators }),
      });
    } catch (err) {
      console.error("Failed to post sync state:", err);
    }
  };

  // Real-time server sync polling loop
  useEffect(() => {
    // Initial server fetch to sync with any pre-existing co-founder modifications
    fetch("/api/sync")
      .then((res) => res.json())
      .then((data) => {
        if (data.notebooks && data.collaborators) {
          setNotebooks((prev) => {
            const merged = data.notebooks.map((serverNb: Notebook) => {
              const localNb = prev.find((n) => n.id === serverNb.id);
              if (!localNb) return serverNb;
              const mergedBlocks = serverNb.blocks.map((serverBlock) => {
                if (serverBlock.id === activeBlockIdRef.current) {
                  const localBlock = localNb.blocks.find((b) => b.id === serverBlock.id);
                  return localBlock ? localBlock : serverBlock;
                }
                return serverBlock;
              });
              return { ...serverNb, blocks: mergedBlocks };
            });
            localStorage.setItem("aurelius_notebooks", JSON.stringify(merged));
            return merged;
          });
          setCollaborators(data.collaborators);
          localStorage.setItem("aurelius_collaborators", JSON.stringify(data.collaborators));
        }
      })
      .catch((err) => console.error("Initial load sync error:", err));

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (data.notebooks && data.collaborators) {
          setNotebooks((prevNotebooks) => {
            const merged = data.notebooks.map((serverNb: Notebook) => {
              const localNb = prevNotebooks.find((n) => n.id === serverNb.id);
              if (!localNb) return serverNb;
              const mergedBlocks = serverNb.blocks.map((serverBlock) => {
                if (serverBlock.id === activeBlockIdRef.current) {
                  const localBlock = localNb.blocks.find((b) => b.id === serverBlock.id);
                  return localBlock ? localBlock : serverBlock;
                }
                return serverBlock;
              });
              return { ...serverNb, blocks: mergedBlocks };
            });
            localStorage.setItem("aurelius_notebooks", JSON.stringify(merged));
            return merged;
          });
          setCollaborators((prev) => {
            localStorage.setItem("aurelius_collaborators", JSON.stringify(data.collaborators));
            return data.collaborators;
          });
        }
      } catch (err) {
        console.error("Polling sync error:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // Sync on window unload / close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Fast navigator.sendBeacon fallback or synchronous post if supported
      const body = JSON.stringify({ notebooks, collaborators });
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/sync", blob);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [notebooks, collaborators]);

  // Load initial email history if any
  useEffect(() => {
    fetch("/api/email-history")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEmailHistory(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Sync analytics when active notebook changes (load default mock if it matches nb1)
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
    if (activeNotebookId === INITIAL_NOTEBOOKS[0].id) {
      setInsight(INITIAL_ANALYTICS_NB1);
    } else {
      setInsight(null);
    }
  }, [activeNotebookId]);

  // Real-time automatic analytical co-founder debounce engine (wow factor on first input)
  const lastAnalyzedContentRef = React.useRef<string>("");
  const activeNotebookIdRefForAuto = React.useRef<string>(activeNotebookId);
  const serializedContent = activeNotebook.blocks
    .map((b) => b.content + (b.table ? JSON.stringify(b.table.rows) : ""))
    .join("\n");

  useEffect(() => {
    // If we changed notebooks, update our reference tracking without running auto-analysis
    if (activeNotebookIdRefForAuto.current !== activeNotebookId) {
      activeNotebookIdRefForAuto.current = activeNotebookId;
      lastAnalyzedContentRef.current = serializedContent;
      return;
    }

    // Skip if empty or matches preloaded initial notebook state to avoid unnecessary calls
    const initialRaw = INITIAL_NOTEBOOKS[0].blocks.map(b => b.content + (b.table ? JSON.stringify(b.table.rows) : "")).join("\n");
    if (!serializedContent.trim() || serializedContent === initialRaw) {
      lastAnalyzedContentRef.current = serializedContent;
      return;
    }

    // Skip if there's no actual content changes
    if (lastAnalyzedContentRef.current === serializedContent) {
      return;
    }

    // Trigger debounced analysis
    const delayDebounceFn = setTimeout(() => {
      lastAnalyzedContentRef.current = serializedContent;
      triggerSageAnalysis();
    }, 1200); // 1.2 second debounce delay for premium real-time responsiveness

    return () => clearTimeout(delayDebounceFn);
  }, [serializedContent, activeNotebookId]);

  // Autopilot simulation loop
  useEffect(() => {
    let interval: any = null;
    if (isAutopilotOn) {
      interval = setInterval(() => {
        setSimulationStep((prev) => {
          const next = prev + 1;
          runAutopilotStep(next);
          return next;
        });
      }, 15000); // Every 15 seconds a co-founder makes a collaborative edit
    } else {
      setSimulationIndicator(null);
    }
    return () => clearInterval(interval);
  }, [isAutopilotOn, activeNotebookId]);

  // Autopilot steps definitions
  const runAutopilotStep = (step: number) => {
    const names = ["Naval Ravikant", "Marc Andreessen", "Ben Horowitz"];
    const name = names[step % names.length];
    
    // 1. Show Typing notification at the top only when editing is occurring
    setSimulationIndicator(`${name} is typing...`);

    // 2. Add realistic notes content (no corporate jargon stats)
    setTimeout(() => {
      setNotebooks((prevNotebooks) => {
        const nextNotebooks = prevNotebooks.map((nb) => {
          if (nb.id === activeNotebookId) {
            const updatedBlocks = [...nb.blocks];
            
            if (step % 3 === 0) {
              updatedBlocks.push({
                id: "sim_b_" + Math.random().toString(36).substr(2, 9),
                type: "bullets",
                content: `• @${name}: Audit Surat fabric mill throughput.\n• @${name}: Map Tamil Nadu subsidy guidelines.`,
                fontSize: "sm",
                italic: true
              });
            } else if (step % 3 === 1) {
              const tableBlockIdx = updatedBlocks.findIndex((b) => b.type === "table");
              if (tableBlockIdx !== -1 && updatedBlocks[tableBlockIdx].table) {
                const tbl = updatedBlocks[tableBlockIdx].table!;
                const updatedRows = [...tbl.rows];
                updatedRows[0] = [
                  updatedRows[0][0], 
                  "50% - Optimised Fabrics", 
                  "Low", 
                  `@${name}`
                ];
                updatedBlocks[tableBlockIdx] = {
                  ...updatedBlocks[tableBlockIdx],
                  table: {
                    ...tbl,
                    rows: updatedRows
                  }
                };
              }
            } else {
              updatedBlocks.push({
                id: "sim_b_" + Math.random().toString(36).substr(2, 9),
                type: "text",
                content: `@${name}: Shared raw cost curves of Chennai port terminals. Initiating tax audit.`,
                bold: true,
                fontSize: "sm",
                highlightColor: "bg-emerald-50"
              });
            }

            return {
              ...nb,
              blocks: updatedBlocks,
              lastUpdated: new Date().toLocaleTimeString().substring(0, 5)
            };
          }
          return nb;
        });

        localStorage.setItem("aurelius_notebooks", JSON.stringify(nextNotebooks));
        postSyncState(nextNotebooks, collaborators);
        return nextNotebooks;
      });

      // Show notification ONLY when they actually post a block!
      setSimulationIndicator(`@${name} posted a new strategic note on the board.`);
      
      // Auto trigger Sage analysis to incorporate the live input!
      triggerSageAnalysis(true);

      // Auto fade-out indicator after 4 seconds
      setTimeout(() => {
        setSimulationIndicator(null);
      }, 4000);

    }, 3000);
  };

  // Strategic Executive AI Call
  const triggerSageAnalysis = async (commandOrAutopilot?: string | boolean) => {
    setIsAnalyzing(true);
    const isAutopilotCall = commandOrAutopilot === true;
    const customCommand = typeof commandOrAutopilot === "string" ? commandOrAutopilot : undefined;
    
    // Join block notes to submit to Gemini
    const notesContent = activeNotebook.blocks
      .map((b) => {
        if (b.type === "text") return b.content;
        if (b.type === "bullets") return `Bullets:\n${b.content}`;
        if (b.type === "table" && b.table) {
          return `Table [${b.table.headers.join(" | ")}]\n${b.table.rows.map((r) => r.join(" | ")).join("\n")}`;
        }
        return "";
      })
      .join("\n\n");

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notesContent,
          command: customCommand || (isAutopilotCall 
            ? "New notes have been added dynamically by co-founders. Analyze the changes, highlight risks, update decision metrics (such as India sounrcing, port warehousing) and formulate a short executive memo."
            : "Formulate short advisor memo, risk matrices, strategic deliverables, action items, and numeric KPIs."),
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error(data.error);
      } else {
        setInsight(data);
      }
    } catch (err) {
      console.error("Analysis Failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text to Speech
  const handleSpeak = (text: string) => {
    setIsSpeaking(true);
    speakText(text, undefined, () => {
      setIsSpeaking(false);
    });
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Manage notebooks
  const handleUpdateNotebook = (updated: Notebook) => {
    const nextNotebooks = notebooks.map((nb) => (nb.id === updated.id ? updated : nb));
    setNotebooks(nextNotebooks);
    localStorage.setItem("aurelius_notebooks", JSON.stringify(nextNotebooks));
    postSyncState(nextNotebooks, collaborators);
  };

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
    localStorage.setItem("aurelius_active_notebook_id", id);
  };

  const handleAddNotebook = () => {
    const newNb: Notebook = {
      id: "nb_" + Math.random().toString(36).substr(2, 9),
      title: "💡 New Brainstorm " + (notebooks.length + 1),
      lastUpdated: new Date().toLocaleTimeString().substring(0, 5),
      collaborators: [CO_FOUNDERS[0]], // HK is default
      blocks: [
        {
          id: "b_init",
          type: "text",
          content: "Tag collaborators like @Himanshi Kalra and draft core logistics, pricing or global scaling objectives. Sage will monitor metrics automatically.",
          fontSize: "base"
        }
      ]
    };
    const nextNotebooks = [...notebooks, newNb];
    setNotebooks(nextNotebooks);
    setActiveNotebookId(newNb.id);
    localStorage.setItem("aurelius_notebooks", JSON.stringify(nextNotebooks));
    localStorage.setItem("aurelius_active_notebook_id", newNb.id);
    postSyncState(nextNotebooks, collaborators);
  };

  const handleDeleteNotebook = (id: string) => {
    if (notebooks.length <= 1) return;
    const remaining = notebooks.filter((nb) => nb.id !== id);
    setNotebooks(remaining);
    const nextActiveId = remaining[0].id;
    setActiveNotebookId(nextActiveId);
    localStorage.setItem("aurelius_notebooks", JSON.stringify(remaining));
    localStorage.setItem("aurelius_active_notebook_id", nextActiveId);
    postSyncState(remaining, collaborators);
  };

  const handleAddCollaborator = (newCol: Collaborator) => {
    const nextCollaborators = [...collaborators, newCol];
    setCollaborators(nextCollaborators);
    localStorage.setItem("aurelius_collaborators", JSON.stringify(nextCollaborators));
    postSyncState(notebooks, nextCollaborators);
  };

  const handleAddEmailLog = (log: EmailLog) => {
    setEmailHistory([log, ...emailHistory]);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-800" id="application_viewport">
      
      {/* Sidebar navigation */}
      <Sidebar
        notebooks={notebooks}
        activeNotebookId={activeNotebookId}
        onSelectNotebook={handleSelectNotebook}
        onAddNotebook={handleAddNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        collaborators={collaborators}
        emailHistory={emailHistory}
        showHistory={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onAddCollaborator={handleAddCollaborator}
      />

      {/* Main Content Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative p-4 md:p-6 space-y-4">
        
        {/* Workspace Header / Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold font-mono text-slate-400 uppercase tracking-wider">
              Workspace Overview
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <p className="text-xs text-slate-600 font-mono font-bold truncate max-w-sm">
              {activeNotebook.title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time simulation toggle */}
            <button
              onClick={() => setIsAutopilotOn(!isAutopilotOn)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isAutopilotOn
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              id="autopilot_simulation_toggle"
              title="Autopilot simulates co-founders typing & collaborative editing in real-time"
            >
              <Users className={`w-3.5 h-3.5 ${isAutopilotOn ? 'animate-pulse text-emerald-600' : ''}`} />
              {isAutopilotOn ? "Autopilot On" : "Autopilot Off"}
            </button>

            {/* Sharing Brief Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-premium transition"
              id="top_share_briefing_button"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Briefing
            </button>
          </div>
        </div>

        {/* Real-time Collaboration/Typing HUD indicator */}
        {simulationIndicator && (
          <div className="bg-blue-900 text-blue-100 px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 shadow-lg animate-bounce border border-blue-700 w-fit max-w-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {simulationIndicator}
          </div>
        )}

        {/* Note Editor Area */}
        <div className="flex-1 flex gap-6 min-h-0 relative">
          
          <NoteEditor
            notebook={activeNotebook}
            onUpdateNotebook={handleUpdateNotebook}
            collaborators={collaborators}
            onTriggerAnalyze={triggerSageAnalysis}
            isAnalyzing={isAnalyzing}
            onSpeak={handleSpeak}
            isSpeaking={isSpeaking}
            onStopSpeaking={handleStopSpeaking}
            onActiveBlockChange={setActiveBlockId}
          />

          {/* JARVIS Intelligent Sidecar */}
          <JarvisAnalytics
            insight={insight}
            isLoading={isAnalyzing}
            isOpen={isJarvisOpen}
            onToggle={() => setIsJarvisOpen(!isJarvisOpen)}
            onSpeak={handleSpeak}
            isSpeaking={isSpeaking}
            onTriggerAnalyze={triggerSageAnalysis}
            notebook={activeNotebook}
            onStopSpeaking={handleStopSpeaking}
          />
        </div>
      </div>

      {/* Share / PDF Dispatcher Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        notebook={activeNotebook}
        insight={insight}
        collaborators={collaborators}
        onAddEmailLog={handleAddEmailLog}
      />

      {/* Outbox Drawer */}
      <EmailHistoryList
        logs={emailHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}

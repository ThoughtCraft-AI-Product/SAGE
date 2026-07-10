import React, { useState, useRef, useEffect } from "react";
import { Notebook, NoteBlock, Collaborator, NoteTable } from "../types";
import { Plus, Table, List, Type, Check, Trash2, Highlighter, Users, Sparkles, Volume2, Mic, MicOff, Play, Square, ListPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NoteEditorProps {
  notebook: Notebook;
  onUpdateNotebook: (updated: Notebook) => void;
  collaborators: Collaborator[];
  onTriggerAnalyze: (command?: string) => void;
  isAnalyzing: boolean;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onActiveBlockChange?: (blockId: string | null) => void;
}

export default function NoteEditor({
  notebook,
  onUpdateNotebook,
  collaborators,
  onTriggerAnalyze,
  isAnalyzing,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
  onActiveBlockChange,
}: NoteEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const currentUser = collaborators.find(c => c.active || c.role.includes("You")) || collaborators[0];

  const handleSetActiveBlockId = (nextId: string | null) => {
    if (activeBlockId && activeBlockId !== nextId) {
      const currentBlock = notebook.blocks.find(b => b.id === activeBlockId);
      if (currentBlock && (currentBlock.type === "text" || currentBlock.type === "bullets") && currentBlock.content.trim() === "") {
        const updatedBlocks = notebook.blocks.filter(b => b.id !== activeBlockId);
        onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
        setActiveBlockId(nextId);
        return;
      }
    }
    setActiveBlockId(nextId);
  };

  useEffect(() => {
    if (onActiveBlockChange) {
      onActiveBlockChange(activeBlockId);
    }
  }, [activeBlockId, onActiveBlockChange]);
  const [firstFocused, setFirstFocused] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [tagSearch, setTagSearch] = useState<string>("");
  const [tagTargetBlockId, setTagTargetBlockId] = useState<string | null>(null);
  const [micActiveBlockId, setMicActiveBlockId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [quickPostText, setQuickPostText] = useState<string>("");
  const [actionExplanation, setActionExplanation] = useState<string | null>(null);

  // Helper: update a specific block
  const updateBlock = (blockId: string, updates: Partial<NoteBlock>) => {
    const updatedBlocks = notebook.blocks.map((block) => {
      if (block.id === blockId) {
        return { ...block, ...updates };
      }
      return block;
    });
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
  };

  const updateBlockContent = (blockId: string, contentUpdater: string | ((prev: string) => string)) => {
    const updatedBlocks = notebook.blocks.map((block) => {
      if (block.id === blockId) {
        const nextContent = typeof contentUpdater === "function" ? contentUpdater(block.content) : contentUpdater;
        return { ...block, content: nextContent };
      }
      return block;
    });
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
  };

  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);

  const applySlashCommand = (blockId: string, command: "bullets" | "table" | "heading" | "poll") => {
    if (command === "bullets") {
      updateBlock(blockId, {
        type: "bullets",
        content: "• ",
        fontSize: "base"
      });
    } else if (command === "table") {
      updateBlock(blockId, {
        type: "table",
        content: "",
        table: {
          headers: ["Strategy", "Projected Savings", "Friction", "Owner"],
          rows: [
            ["", "", "", ""],
            ["", "", "", ""]
          ]
        }
      });
    } else if (command === "heading") {
      updateBlock(blockId, {
        type: "text",
        content: "",
        fontSize: "xl",
        bold: true
      });
    } else if (command === "poll") {
      updateBlock(blockId, {
        type: "poll",
        content: "",
        poll: {
          question: "Strategy Poll",
          options: [
            { id: "opt_1", text: "Option A", votes: 0 },
            { id: "opt_2", text: "Option B", votes: 0 }
          ],
          votedUserIds: []
        }
      });
    }
    setSlashMenuBlockId(null);
  };

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition ONCE on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;
    }
  }, []);

  // Update Speech Recognition event handlers dynamically to ensure fresh state access
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript && micActiveBlockId) {
          updateBlockContent(micActiveBlockId, (prev) => {
            const current = prev.trim();
            // Filter out duplicate phrases if speech recognition emits duplicates
            if (current.endsWith(finalTranscript.trim())) {
              return prev;
            }
            return current ? `${current} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };

      recognitionRef.current.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
        setMicActiveBlockId(null);
        if (err.error === "not-allowed") {
          setMicError("Microphone permission was denied. Please click the mic icon and allow microphone access in your browser address bar.");
        } else {
          setMicError(`Speech recognition error: ${err.error || "unknown"}. Ensure a microphone is connected.`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setMicActiveBlockId(null);
      };
    }
  }, [micActiveBlockId, notebook.blocks, updateBlockContent]);

  // Handle Speech-to-Text Mic toggle
  const toggleMic = (blockId: string) => {
    setMicError(null);
    if (!recognitionRef.current) {
      setMicError("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    if (isRecording && micActiveBlockId === blockId) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setMicActiveBlockId(null);
    } else {
      if (isRecording) {
        recognitionRef.current.stop();
      }
      setMicActiveBlockId(blockId);
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
        setMicError("Failed to start speech recognition. Please verify microphone access.");
      }
    }
  };

  const addPollBlock = () => {
    const newBlock: NoteBlock = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type: "poll",
      content: "",
      poll: {
        question: "Brainboard Interactive Strategy Poll",
        options: [
          { id: "opt_1", text: "Pivot model & sourcing", votes: 0 },
          { id: "opt_2", text: "Automate warehouses & ports", votes: 0 }
        ],
        votedUserIds: []
      }
    };
    onUpdateNotebook({
      ...notebook,
      blocks: [...notebook.blocks.filter(b => b.content.trim() !== "" || b.type === "table" || b.type === "poll"), {
        ...newBlock,
        authorName: currentUser?.name,
        authorAvatar: currentUser?.avatar
      }],
    });
    handleSetActiveBlockId(newBlock.id);
  };

  const addSwotTemplate = () => {
    const swotBlock: NoteBlock = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type: "table",
      content: "",
      table: {
        headers: ["SWOT Dimension", "Discovered Factors", "Leadership Action Plan", "Strategic Lead"],
        rows: [
          ["Strengths (S)", "Established brand & local supply chain presence", "Leverage regional networks & deep co-founder circles", "@Himanshi Kalra"],
          ["Weaknesses (W)", "High overhead cost in non-automated warehouses", "Chennai automated sorting warehouse initiative", "@Marc Andreessen"],
          ["Opportunities (O)", "Indian clean-tech manufacturing subsidies available", "Apply for Q4 green subsidies to secure 10% extra margin", "@Ben Horowitz"],
          ["Threats (T)", "Sourcing cost volatility of cotton index", "Purchase index hedges to secure raw material margins", "@Naval Ravikant"],
        ],
      },
      authorName: currentUser?.name,
      authorAvatar: currentUser?.avatar,
    };
    onUpdateNotebook({
      ...notebook,
      blocks: [...notebook.blocks.filter(b => b.content.trim() !== "" || b.type === "table" || b.type === "poll"), swotBlock],
    });
    handleSetActiveBlockId(swotBlock.id);
  };

  const addLeanCanvasTemplate = () => {
    const canvasBlock: NoteBlock = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type: "table",
      content: "",
      table: {
        headers: ["Lean Canvas Element", "Brief / Hypotheses", "Current Status", "Owner"],
        rows: [
          ["1. Problem", "High logistics latency & material price fluctuations", "Validated with top-tier suppliers", "@Himanshi Kalra"],
          ["2. Solution", "Decentralized Surat/Chennai automated logistics hub", "Prototype operational in Chennai", "@Marc Andreessen"],
          ["3. Key Metrics", "Delivery Turnaround (TAT) and Gross Margin %", "Targeting TAT < 8 Days", "@Ben Horowitz"],
          ["4. Cost Structure", "Automation capex, warehouse rents, sourcing premium", "Offset by Q4 clean-tech green subsidies", "@Naval Ravikant"],
        ],
      },
      authorName: currentUser?.name,
      authorAvatar: currentUser?.avatar,
    };
    onUpdateNotebook({
      ...notebook,
      blocks: [...notebook.blocks.filter(b => b.content.trim() !== "" || b.type === "table" || b.type === "poll"), canvasBlock],
    });
    handleSetActiveBlockId(canvasBlock.id);
  };

  // Helper: Add new text block
  const addTextBlock = () => {
    const newBlock: NoteBlock = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type: "text",
      content: "",
      fontSize: "base",
      authorName: currentUser?.name,
      authorAvatar: currentUser?.avatar,
    };
    onUpdateNotebook({
      ...notebook,
      blocks: [...notebook.blocks.filter(b => b.content.trim() !== "" || b.type === "table" || b.type === "poll"), newBlock],
    });
    handleSetActiveBlockId(newBlock.id);
  };

  // Helper: Add new Bullet block
  const addBulletBlock = () => {
    const newBlock: NoteBlock = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type: "bullets",
      content: "• Sourcing raw fabric from India ports\n• Establishing local distribution networks\n• Shifting production lines for cost cutting",
      fontSize: "base",
      authorName: currentUser?.name,
      authorAvatar: currentUser?.avatar,
    };
    onUpdateNotebook({
      ...notebook,
      blocks: [...notebook.blocks.filter(b => b.content.trim() !== "" || b.type === "table" || b.type === "poll"), newBlock],
    });
    handleSetActiveBlockId(newBlock.id);
  };

  // Helper: Add table block
  const addTableBlock = () => {
    const newBlock: NoteBlock = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type: "table",
      content: "",
      table: {
        headers: ["Region", "Logistics Cost", "Timeframe", "Owner"],
        rows: [
          ["Mumbai Hub", "$2.4k / ton", "12 Days", "@Naval Ravikant"],
          ["Surat Sourcing", "$1.8k / ton", "8 Days", "@Himanshi Kalra"],
        ],
      },
      authorName: currentUser?.name,
      authorAvatar: currentUser?.avatar,
    };
    onUpdateNotebook({
      ...notebook,
      blocks: [...notebook.blocks.filter(b => b.content.trim() !== "" || b.type === "table" || b.type === "poll"), newBlock],
    });
    handleSetActiveBlockId(newBlock.id);
  };

  // Helper: Delete block
  const deleteBlock = (blockId: string) => {
    const updatedBlocks = notebook.blocks.filter((b) => b.id !== blockId);
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
  };

  // Formatting tools helpers
  const toggleBold = (block: NoteBlock) => {
    updateBlock(block.id, { bold: !block.bold });
  };

  const toggleItalic = (block: NoteBlock) => {
    updateBlock(block.id, { italic: !block.italic });
  };

  const changeFontSize = (block: NoteBlock) => {
    const sizes: ("sm" | "base" | "lg" | "xl")[] = ["sm", "base", "lg", "xl"];
    const currentIndex = sizes.indexOf(block.fontSize || "base");
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateBlock(block.id, { fontSize: sizes[nextIndex] });
  };

  const changeHighlight = (block: NoteBlock, color: string | undefined) => {
    updateBlock(block.id, { highlightColor: color });
  };

  // Table cell editing
  const updateTableCell = (blockId: string, rowIndex: number, colIndex: number, val: string) => {
    const updatedBlocks = notebook.blocks.map((block) => {
      if (block.id === blockId && block.table) {
        const rows = [...block.table.rows];
        rows[rowIndex] = [...rows[rowIndex]];
        rows[rowIndex][colIndex] = val;
        return {
          ...block,
          table: {
            ...block.table,
            rows,
          },
        };
      }
      return block;
    });
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
  };

  const addTableRow = (blockId: string) => {
    const updatedBlocks = notebook.blocks.map((block) => {
      if (block.id === blockId && block.table) {
        const emptyRow = Array(block.table.headers.length).fill("");
        return {
          ...block,
          table: {
            ...block.table,
            rows: [...block.table.rows, emptyRow],
          },
        };
      }
      return block;
    });
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
  };

  const deleteTableRow = (blockId: string, rowIndex: number) => {
    const updatedBlocks = notebook.blocks.map((block) => {
      if (block.id === blockId && block.table) {
        const rows = block.table.rows.filter((_, idx) => idx !== rowIndex);
        return {
          ...block,
          table: {
            ...block.table,
            rows,
          },
        };
      }
      return block;
    });
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
  };

  const addTableColumn = (blockId: string) => {
    const updatedBlocks = notebook.blocks.map((block) => {
      if (block.id === blockId && block.table) {
        const headers = [...block.table.headers, "New Header"];
        const rows = block.table.rows.map((row) => [...row, ""]);
        return {
          ...block,
          table: {
            headers,
            rows,
          },
        };
      }
      return block;
    });
    onUpdateNotebook({ ...notebook, blocks: updatedBlocks });
  };

  // Mentions / tagging system
  const triggerTagMenu = (blockId: string) => {
    setTagTargetBlockId(blockId);
    setTagSearch("");
    setShowTagMenu(true);
  };

  const insertMention = (collaborator: Collaborator) => {
    if (tagTargetBlockId) {
      updateBlockContent(tagTargetBlockId, (prev) => {
        const mention = ` @${collaborator.name} `;
        return prev + mention;
      });
    }
    setShowTagMenu(false);
    setTagTargetBlockId(null);
  };

  // Detect key "@" to open tags menu, and commit on Enter without Shift
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string) => {
    if (e.key === "@") {
      triggerTagMenu(blockId);
    }
    if (e.key === "/") {
      const block = notebook.blocks.find((b) => b.id === blockId);
      if (block && (!block.content || block.content === "")) {
        setSlashMenuBlockId(blockId);
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setActiveBlockId(null); // commitments / deactivates editing mode
    }
  };

  // Render text containing tagged collaborator names with pill badges
  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-gray-400 italic font-mono text-xs">Type notes or use mic to dictate...</span>;

    const parts = text.split(/(@\w+\s\w+|@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const cleanName = part.substring(1);
        const match = collaborators.find((c) => c.name.toLowerCase().includes(cleanName.toLowerCase()));
        if (match) {
          const badgeColors: Record<string, string> = {
            emerald: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
            amber: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
            cyan: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
            rose: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
            indigo: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
          };
          const bgClass = badgeColors[match.color] || "bg-gray-100 text-gray-800";
          return (
            <span
              key={index}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border ${bgClass} mx-0.5 shadow-sm`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {match.name}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-premium h-full relative" id="editor_main_frame">
      {/* Editorial Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <input
              type="text"
              value={notebook.title}
              onChange={(e) => onUpdateNotebook({ ...notebook, title: e.target.value })}
              className="text-lg font-bold font-sans text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition w-80 md:w-96"
              id="notebook_title_input"
            />
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Active Session • Last Saved: {notebook.lastUpdated}
            </p>
          </div>
        </div>

        {/* Dynamic Voice Controls */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              {/* Dynamic Wave Visualizer */}
              <div className="flex items-center gap-1.5 px-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider animate-pulse">Voice active</span>
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-0.5 bg-slate-400 rounded-full animate-wave-bar-1 h-2"></span>
                  <span className="w-0.5 bg-slate-400 rounded-full animate-wave-bar-2 h-3.5"></span>
                  <span className="w-0.5 bg-slate-400 rounded-full animate-wave-bar-3 h-1.5"></span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (isSpeaking) {
                onStopSpeaking();
              } else {
                const textToRead = notebook.blocks
                  .filter((b) => b.type === "text")
                  .map((b) => b.content)
                  .join(". ");
                onSpeak(textToRead || "No text blocks to speak back.");
              }
            }}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
              isSpeaking
                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs"
            }`}
            title={isSpeaking ? "Stop Voice" : "Listen to Board"}
            id="header_listen_board_button"
          >
            {isSpeaking ? <Square className="w-4 h-4 fill-current animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Speech-to-Text error or feedback alert */}
      {micError && (
        <div className="mx-6 mt-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 shadow-xs relative animate-fadeIn">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 mt-1.5 animate-ping" />
          <div className="flex-1">
            <span className="font-bold">Microphone Co-Pilot Status:</span> {micError}
          </div>
          <button
            onClick={() => setMicError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold px-1.5 py-0.5 text-2xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Structured Blocks List */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-270px)] scrollbar-thin scrollbar-thumb-slate-200 cursor-text"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            addTextBlock();
          }
        }}
      >
        {notebook.blocks.length === 0 ? (
          <div className="py-2 px-4 w-full h-full min-h-[250px] animate-fadeIn">
            <textarea
              onChange={(e) => {
                const text = e.target.value;
                const newId = "b_init_" + Math.random().toString(36).substr(2, 9);
                onUpdateNotebook({
                  ...notebook,
                  blocks: [
                    {
                      id: newId,
                      type: "text",
                      content: text,
                      fontSize: "base",
                      authorName: currentUser?.name,
                      authorAvatar: currentUser?.avatar
                    }
                  ]
                });
                handleSetActiveBlockId(newId);
              }}
              onFocus={() => setFirstFocused(true)}
              onBlur={() => setFirstFocused(false)}
              placeholder={firstFocused ? "" : "Type here, or press / for options"}
              className="w-full min-h-[250px] bg-transparent resize-none focus:outline-none text-base text-slate-700 font-sans"
              autoFocus
            />
          </div>
        ) : (
          <>
            {notebook.blocks.map((block) => {
            const isEditing = activeBlockId === block.id;
            const fontClass =
              block.fontSize === "sm"
                ? "text-xs"
                : block.fontSize === "lg"
                ? "text-lg"
                : block.fontSize === "xl"
                ? "text-xl font-semibold"
                : "text-base";

            const authorName = block.authorName || "Himanshi Kalra";
            const authorAvatar = block.authorAvatar || "HK";
            const authorColorClass = 
              authorName.includes("Himanshi") ? "bg-indigo-600" :
              authorName.includes("Naval") ? "bg-emerald-600" :
              authorName.includes("Marc") ? "bg-blue-600" :
              authorName.includes("Ben") ? "bg-amber-600" : "bg-slate-600";

            return (
               <div
                 key={block.id}
                 onClick={() => {
                   if (!isEditing) handleSetActiveBlockId(block.id);
                 }}
                 className={`group border border-transparent bg-transparent transition-all duration-200 py-3 relative px-4 hover:bg-slate-50/45 rounded-xl ${
                   isEditing
                     ? "!border-slate-200 !bg-slate-50/30 shadow-premium px-4 rounded-xl"
                     : ""
                 } ${block.highlightColor || ""}`}
                 id={`block_item_${block.id}`}
               >
                 {/* Teams/Slack style author attribution header */}
                 <div className="flex items-center gap-2 mb-2 select-none border-b border-slate-100/40 pb-1">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shadow-3xs ${authorColorClass}`}>
                     {authorAvatar}
                   </div>
                   <span className="text-2xs font-bold text-slate-700 font-sans">
                     {authorName}
                   </span>
                   <span className="text-[9px] text-slate-400 font-mono">
                     {authorName.includes("Himanshi") ? "Lead Founder" : "Strategic Partner"}
                   </span>
                 </div>
                {isEditing ? (
                  /* Editing Layout: Toolbar on TOP, text block below with FULL width! */
                  <div className="flex flex-col gap-3.5 w-full animate-fadeIn">
                    {/* Top-aligned formatting toolbar for active block */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 mb-1 gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Dictate / mic button for text blocks */}
                        {(block.type === "text" || block.type === "bullets") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMic(block.id);
                              setActionExplanation("Microphone: Listening co-pilot active");
                            }}
                            onMouseEnter={() => setActionExplanation("Microphone: dictation via speech-to-text")}
                            onMouseLeave={() => setActionExplanation(null)}
                            className={`p-1.5 rounded-lg transition border cursor-pointer ${
                              micActiveBlockId === block.id && isRecording
                                ? "bg-rose-100 border-rose-300 text-rose-600 animate-pulse"
                                : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500 hover:border-slate-200"
                            }`}
                            title={micActiveBlockId === block.id && isRecording ? "Stop Listening (Co-Pilot Active)" : "Dictate text via microphone"}
                          >
                            {micActiveBlockId === block.id && isRecording ? (
                              <MicOff className="w-3.5 h-3.5" />
                            ) : (
                              <Mic className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Toggle Type to Bullets or Text */}
                        {(block.type === "text" || block.type === "bullets") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetType = block.type === "text" ? "bullets" : "text";
                              let targetContent = block.content;
                              if (block.type === "text" && targetType === "bullets") {
                                targetContent = targetContent.trim() ? `• ${targetContent}` : "• ";
                              } else if (block.type === "bullets" && targetType === "text") {
                                targetContent = targetContent.replace(/^[•\-\*]\s*/gm, "");
                              }
                              updateBlock(block.id, { type: targetType, content: targetContent });
                              setActionExplanation(targetType === "bullets" ? "Converted to Bullet List" : "Converted to Paragraph Text");
                            }}
                            onMouseEnter={() => setActionExplanation("Toggle list: switch paragraphs to bullets")}
                            onMouseLeave={() => setActionExplanation(null)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${block.type === "bullets" ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500 hover:border-slate-200'}`}
                            title={block.type === "text" ? "Convert block to Bullet List style" : "Convert block to Paragraph Text style"}
                            id={`convert_bullet_toggle_${block.id}`}
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Bold button */}
                        {block.type === "text" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBold(block);
                              setActionExplanation(block.bold ? "Removed Bold typeface" : "Applied Bold typeface");
                            }}
                            onMouseEnter={() => setActionExplanation("Bold text: Toggle extra font weight")}
                            onMouseLeave={() => setActionExplanation(null)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition cursor-pointer ${block.bold ? 'bg-blue-100 border-blue-300 text-blue-700 font-extrabold' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500 hover:border-slate-200'}`}
                            title={block.bold ? "Active Bold. Click to remove." : "Apply Bold typography"}
                          >
                            <span className="font-bold text-xs">B</span>
                          </button>
                        )}

                        {/* Bullet option in text block itself */}
                        {block.type === "text" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBlockContent(block.id, (prev) => {
                                const trimmed = prev.trim();
                                return trimmed ? `${prev}\n• ` : "• ";
                              });
                              setActionExplanation("Inserted Bullet list line");
                            }}
                            onMouseEnter={() => setActionExplanation("Insert bullet: append bullet list point inside paragraph")}
                            onMouseLeave={() => setActionExplanation(null)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                            title="Insert bullet list line inside this text block"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                        )}

                        {/* Italic button */}
                        {block.type === "text" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItalic(block);
                              setActionExplanation(block.italic ? "Removed Italic typeface" : "Applied Italic typeface");
                            }}
                            onMouseEnter={() => setActionExplanation("Italic text: Toggle emphasis typeface")}
                            onMouseLeave={() => setActionExplanation(null)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition cursor-pointer ${block.italic ? 'bg-blue-100 border-blue-300 text-blue-700 font-extrabold' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500 hover:border-slate-200'}`}
                            title={block.italic ? "Active Italic. Click to remove." : "Apply Italic typography"}
                          >
                            <span className="italic font-serif text-xs">I</span>
                          </button>
                        )}

                        {/* Size changer */}
                        {block.type === "text" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              changeFontSize(block);
                              const sizes: ("sm" | "base" | "lg" | "xl")[] = ["sm", "base", "lg", "xl"];
                              const idx = sizes.indexOf(block.fontSize || "base");
                              const next = sizes[(idx + 1) % sizes.length];
                              setActionExplanation(`Resized text to ${next.toUpperCase()}`);
                            }}
                            onMouseEnter={() => setActionExplanation(`Text size is: ${block.fontSize || "base"}. Click to cycle sm/base/lg/xl`)}
                            onMouseLeave={() => setActionExplanation(null)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                            title={`Text size is: ${block.fontSize || "base"}. Click to cycle size (sm / base / lg / xl).`}
                          >
                            <span className="font-mono text-2xs uppercase font-bold">{block.fontSize || "base"}</span>
                          </button>
                        )}

                        {/* Highlight colors */}
                        {block.type === "text" && (
                          <div 
                            className="relative flex gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100"
                            onMouseEnter={() => setActionExplanation("Marker highlights: tag priorities with colors")}
                            onMouseLeave={() => setActionExplanation(null)}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); changeHighlight(block, "bg-amber-50"); setActionExplanation("Amber priority highlighter active"); }}
                              className={`w-3.5 h-3.5 rounded-full bg-amber-200 border cursor-pointer transition ${block.highlightColor === "bg-amber-50" ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : "border-amber-300"}`}
                              title="Apply Amber high-energy highlighter"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); changeHighlight(block, "bg-emerald-50"); setActionExplanation("Emerald synergy highlighter active"); }}
                              className={`w-3.5 h-3.5 rounded-full bg-emerald-200 border cursor-pointer transition ${block.highlightColor === "bg-emerald-50" ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : "border-emerald-300"}`}
                              title="Apply Emerald synergy highlighter"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); changeHighlight(block, "bg-sky-50"); setActionExplanation("Sky calm-focus highlighter active"); }}
                              className={`w-3.5 h-3.5 rounded-full bg-sky-200 border cursor-pointer transition ${block.highlightColor === "bg-sky-50" ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : "border-sky-300"}`}
                              title="Apply Sky calm-focus highlighter"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); changeHighlight(block, undefined); setActionExplanation("Cleared highlighting"); }}
                              className="w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-slate-300 border border-slate-300 flex items-center justify-center text-[10px] text-slate-600 font-extrabold cursor-pointer"
                              title="Clear marker highlighting"
                              id={`clear_highlight_marker_${block.id}`}
                            >
                              Ø
                            </button>
                          </div>
                        )}

                        {/* Mentions tagging */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerTagMenu(block.id);
                            setActionExplanation("Select a co-founder to tag them");
                          }}
                          onMouseEnter={() => setActionExplanation("Mentions: @tag partners to collaborate")}
                          onMouseLeave={() => setActionExplanation(null)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-500 rounded-lg transition cursor-pointer"
                          title="Tag/mention a co-founder"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete block */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                            setActionExplanation(null);
                          }}
                          onMouseEnter={() => setActionExplanation("Delete block: erase this permanently")}
                          onMouseLeave={() => setActionExplanation(null)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 rounded-lg text-slate-400 transition cursor-pointer"
                          title="Delete this block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {actionExplanation && (
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            💡 {actionExplanation}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBlockId(null);
                          }}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-3xs font-bold uppercase font-mono px-2 py-1 rounded shadow-xs cursor-pointer transition"
                          title="Finish editing block"
                        >
                          <Check className="w-3 h-3" />
                          Done
                        </button>
                      </div>
                    </div>

                    {/* Content below, now spanning 100% full space! */}
                    <div className="flex items-start gap-3 w-full">
                      {/* Block symbol icon */}
                      <div className="mt-1 shrink-0">
                        {block.type === "table" ? (
                          <Table className="w-4 h-4 text-amber-500" />
                        ) : block.type === "bullets" ? (
                          <List className="w-4 h-4 text-emerald-500" />
                        ) : block.type === "poll" ? (
                          <Check className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Type className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Content edit container */}
                      <div className="flex-1 min-w-0 w-full">
                        {block.type === "text" && (
                          <div className="relative">
                            <textarea
                              value={block.content}
                              onChange={(e) => {
                                let val = e.target.value;
                                const default1 = "Tag co-founders like @Naval Ravikant or @Marc Andreessen and draft core logistics, pricing or global scaling objectives. Sage will monitor metrics automatically.";
                                const default2 = "Tag collaborators like @Himanshi Kalra and draft core logistics, pricing or global scaling objectives. Sage will monitor metrics automatically.";
                                if ((block.content === default1 || block.content === default2) && val !== block.content) {
                                  if (val.startsWith(default1)) {
                                    val = val.substring(default1.length);
                                  } else if (val.endsWith(default1)) {
                                    val = val.substring(0, val.length - default1.length);
                                  } else if (val.startsWith(default2)) {
                                    val = val.substring(default2.length);
                                  } else if (val.endsWith(default2)) {
                                    val = val.substring(0, val.length - default2.length);
                                  } else {
                                    val = "";
                                  }
                                }
                                updateBlockContent(block.id, val);
                                if (val === "/") {
                                  setSlashMenuBlockId(block.id);
                                } else if (!val.includes("/")) {
                                  setSlashMenuBlockId(null);
                                }
                              }}
                              onKeyDown={(e) => handleTextareaKeyDown(e, block.id)}
                              placeholder="Type here, or press / for options"
                              className={`w-full bg-transparent resize-none focus:outline-none ${fontClass} ${
                                block.bold ? "font-bold" : ""
                              } ${block.italic ? "italic" : ""}`}
                              rows={3}
                              autoFocus
                            />

                            {/* Slash Command Popover Dropdown Menu */}
                            {slashMenuBlockId === block.id && (
                              <div 
                                className="absolute left-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl p-2 z-50 animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
                                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                                    Document Slash Actions
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <button
                                    onClick={() => applySlashCommand(block.id, "bullets")}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs text-left text-slate-200 hover:text-white transition cursor-pointer"
                                  >
                                    <List className="w-3.5 h-3.5 text-emerald-400" />
                                    <div>
                                      <div className="font-bold">Bullet List</div>
                                      <div className="text-[10px] text-slate-400">Insert bulleted points</div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => applySlashCommand(block.id, "table")}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs text-left text-slate-200 hover:text-white transition cursor-pointer"
                                  >
                                    <Table className="w-3.5 h-3.5 text-amber-400" />
                                    <div>
                                      <div className="font-bold">Insert Table</div>
                                      <div className="text-[10px] text-slate-400">Add strategy comparison table</div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => applySlashCommand(block.id, "heading")}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs text-left text-slate-200 hover:text-white transition cursor-pointer"
                                  >
                                    <Type className="w-3.5 h-3.5 text-blue-400" />
                                    <div>
                                      <div className="font-bold">Heading (H1)</div>
                                      <div className="text-[10px] text-slate-400">Convert to display heading</div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => applySlashCommand(block.id, "poll")}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs text-left text-slate-200 hover:text-white transition cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                    <div>
                                      <div className="font-bold">Create Poll</div>
                                      <div className="text-[10px] text-slate-400">Insert a co-founder vote poll</div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === "bullets" && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlockContent(block.id, e.target.value)}
                            placeholder="• High-priority items..."
                            className={`w-full bg-transparent resize-none focus:outline-none ${fontClass} font-mono`}
                            rows={3}
                            autoFocus
                          />
                        )}

                        {block.type === "table" && block.table && (
                          <div className="overflow-x-auto w-full">
                            <table className="min-w-full divide-y divide-slate-100 border border-slate-100 rounded-lg">
                              <thead className="bg-slate-50">
                                <tr>
                                  {block.table.headers.map((hdr, hIdx) => (
                                    <th key={hIdx} className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                                      {hdr}
                                    </th>
                                  ))}
                                  <th className="w-10"></th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100">
                                {block.table.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50/50">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-3 py-1.5 text-sm text-slate-700">
                                        <input
                                          type="text"
                                          value={cell}
                                          onChange={(e) => updateTableCell(block.id, rIdx, cIdx, e.target.value)}
                                          className="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-1"
                                        />
                                      </td>
                                    ))}
                                    <td className="px-2 py-1 text-center">
                                      <button
                                        onClick={() => deleteTableRow(block.id, rIdx)}
                                        className="text-slate-400 hover:text-rose-600 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => addTableRow(block.id)}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-mono"
                              >
                                + Add Row
                              </button>
                              <button
                                onClick={() => addTableColumn(block.id)}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-mono"
                              >
                                + Add Column
                              </button>
                            </div>
                          </div>
                        )}

                        {block.type === "poll" && block.poll && (
                          <div className="space-y-2">
                            <label className="block text-3xs font-bold font-mono text-slate-400 uppercase tracking-wider">Poll Question</label>
                            <input
                              type="text"
                              value={block.poll.question}
                              onChange={(e) => {
                                const updatedPoll = { ...block.poll!, question: e.target.value };
                                updateBlock(block.id, { poll: updatedPoll });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                              placeholder="Type poll question..."
                            />
                            
                            <label className="block text-3xs font-bold font-mono text-slate-400 uppercase tracking-wider mt-2">Options</label>
                            <div className="space-y-1.5">
                              {block.poll.options.map((opt, oIdx) => (
                                <div key={opt.id} className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => {
                                      const updatedOptions = block.poll!.options.map((o) =>
                                        o.id === opt.id ? { ...o, text: e.target.value } : o
                                      );
                                      updateBlock(block.id, { poll: { ...block.poll!, options: updatedOptions } });
                                    }}
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                                    placeholder={`Option ${oIdx + 1}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const updatedOptions = block.poll!.options.filter((o) => o.id !== opt.id);
                                      updateBlock(block.id, { poll: { ...block.poll!, options: updatedOptions } });
                                    }}
                                    className="p-1 hover:text-red-500 transition text-slate-400"
                                    title="Delete option"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newOpt = {
                                    id: "opt_" + Math.random().toString(36).substr(2, 9),
                                    text: `New Option`,
                                    votes: 0
                                  };
                                  updateBlock(block.id, { poll: { ...block.poll!, options: [...block.poll!.options, newOpt] } });
                                }}
                                className="text-3xs font-bold text-blue-600 hover:underline uppercase font-mono tracking-wider pt-1 block"
                              >
                                + Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Read Layout: Clean presentation layout with hover actions */
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Left icon */}
                      <div className="mt-1 shrink-0">
                        {block.type === "table" ? (
                          <Table className="w-4 h-4 text-amber-500" />
                        ) : block.type === "bullets" ? (
                          <List className="w-4 h-4 text-emerald-500" />
                        ) : block.type === "poll" ? (
                          <Check className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Type className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Content view */}
                      <div className="flex-1 min-w-0">
                        {block.type === "text" && (
                          <p className={`${fontClass} ${block.bold ? "font-bold" : ""} ${block.italic ? "italic" : ""} text-slate-700 leading-relaxed`}>
                            {renderFormattedText(block.content)}
                          </p>
                        )}

                        {block.type === "bullets" && (
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {block.content.split("\n").map((line, lIdx) => (
                              <li key={lIdx} className={fontClass}>
                                {renderFormattedText(line.replace(/^[•\-\*]\s*/, ""))}
                              </li>
                            ))}
                          </ul>
                        )}

                        {block.type === "table" && block.table && (
                          <div className="overflow-x-auto w-full">
                            <table className="min-w-full divide-y divide-slate-100 border border-slate-100 rounded-lg">
                              <thead className="bg-slate-50">
                                <tr>
                                  {block.table.headers.map((hdr, hIdx) => (
                                    <th key={hIdx} className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                                      {hdr}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100">
                                {block.table.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50/50">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-3 py-1.5 text-sm text-slate-700">
                                        {renderFormattedText(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {block.type === "poll" && block.poll && (
                          <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-800 font-sans">{block.poll.question}</h4>
                            <div className="space-y-2">
                              {(() => {
                                const totalVotes = block.poll.options.reduce((acc, o) => acc + o.votes, 0);
                                return block.poll.options.map((opt) => {
                                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                  return (
                                    <div
                                      key={opt.id}
                                      onClick={() => {
                                        // Vote simulation with real-time feedback
                                        const updatedOptions = block.poll!.options.map((o) =>
                                          o.id === opt.id ? { ...o, votes: o.votes + 1 } : o
                                        );
                                        updateBlock(block.id, { poll: { ...block.poll!, options: updatedOptions } });
                                      }}
                                      className="group/opt cursor-pointer relative bg-white border border-slate-200/80 hover:border-blue-300 p-2.5 rounded-lg overflow-hidden transition"
                                    >
                                      {/* Percent Bar Fill */}
                                      <div
                                        className="absolute inset-y-0 left-0 bg-blue-500/10 transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                      <div className="relative flex justify-between items-center text-xs text-slate-700">
                                        <span className="font-semibold group-hover/opt:text-blue-700 transition">{opt.text}</span>
                                        <span className="font-mono font-bold text-slate-500 group-hover/opt:text-blue-600 transition">
                                          {opt.votes} votes ({pct}%)
                                        </span>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono italic">
                              💡 Live Interaction: Click any option above to cast your vote.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Small hover-visible buttons on right */}
                    <div className="opacity-0 group-hover:opacity-100 transition duration-150 flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActiveBlockId(block.id);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition animate-fadeIn"
                        title="Edit block"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(block.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition animate-fadeIn"
                        title="Delete block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Faint placeholder indicator at the end to make it feel like a real doc */}
          <div 
            className="py-4 px-4 text-slate-300 text-sm font-sans italic hover:text-slate-400 hover:bg-slate-50/30 rounded-xl cursor-pointer flex items-center gap-2 select-none transition"
            onClick={addTextBlock}
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>Type here, or press / for options</span>
          </div>
        </>
        )}
      </div>

      {/* Popover Menus */}
      <AnimatePresence>
        {showTagMenu && (
          <div className="absolute top-1/4 left-1/3 w-64 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 p-3 z-50">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Mention Collaborator</span>
              <button onClick={() => setShowTagMenu(false)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>
            <input
              type="text"
              placeholder="Search co-founder..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none mb-2"
              autoFocus
            />
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {collaborators
                .filter((col) => col.name.toLowerCase().includes(tagSearch.toLowerCase()))
                .map((col) => (
                  <button
                    key={col.id}
                    onClick={() => insertMention(col)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs transition"
                  >
                    <span className="w-5 h-5 bg-blue-600 flex items-center justify-center text-3xs font-extrabold rounded-full text-white">
                      {col.avatar}
                    </span>
                    <div>
                      <p className="font-bold">{col.name}</p>
                      <p className="text-3xs text-slate-400 font-mono">{col.role}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Editor Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Tip: Click empty space to add blocks. Type <span className="font-bold text-slate-600">/</span> for options, or <span className="font-bold text-slate-600">@</span> to tag co-founders.</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { JarvisInsight, ActionItem, DecisionAnalytic, Notebook } from "../types";
import { Sparkles, AlertTriangle, RefreshCw, CheckSquare, ChevronRight, ChevronLeft, Volume2, Play, CornerDownRight, TrendingDown, DollarSign, ThumbsUp, ThumbsDown, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface JarvisAnalyticsProps {
  insight: JarvisInsight | null;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onTriggerAnalyze: (command?: string) => void;
  notebook?: Notebook;
  onStopSpeaking?: () => void;
}

export default function JarvisAnalytics({
  insight,
  isLoading,
  isOpen,
  onToggle,
  onSpeak,
  isSpeaking,
  onTriggerAnalyze,
  notebook,
  onStopSpeaking,
}: JarvisAnalyticsProps) {

  const [votedStatus, setVotedStatus] = useState<"up" | "down" | null>(null);
  const [upvotes, setUpvotes] = useState<number>(12);
  const [downvotes, setDownvotes] = useState<number>(1);

  const getCostRange = () => {
    if (insight?.decisionAnalytics) {
      const found = insight.decisionAnalytics.find(m => 
        m.metric.toLowerCase().includes("cost") || 
        m.metric.toLowerCase().includes("price") ||
        m.metric.toLowerCase().includes("budget") ||
        m.metric.toLowerCase().includes("range")
      );
      if (found) return { value: found.value, context: found.context, label: found.metric };
    }
    return { value: "$12,000 - $25,000", context: "estimated incorporation, nominee directorship, and basic cloud retainers", label: "Estimated Cost Range" };
  };

  const getTimelineRisk = () => {
    let timeline = "14 - 30 Days";
    if (insight?.decisionAnalytics) {
      const foundTime = insight.decisionAnalytics.find(m => 
        m.metric.toLowerCase().includes("time") || 
        m.metric.toLowerCase().includes("speed") ||
        m.metric.toLowerCase().includes("duration") ||
        m.metric.toLowerCase().includes("days")
      );
      if (foundTime) {
        timeline = `${foundTime.value} (${foundTime.context})`;
      }
    }
    const risk = (insight?.risks && insight.risks.length > 0) 
      ? insight.risks[0] 
      : "Nominee director liabilities and initial service licensing hurdles.";
    return { timeline, risk };
  };

  const getKeyDependencies = () => {
    if (insight?.changingFactors && insight.changingFactors.length > 0) {
      return insight.changingFactors.slice(0, 2).map(f => f.replace(/^[•\-\*\d\.\s]+/g, "").trim());
    }
    return [
      "ACRA registration approval and resident director verification",
      "Corporate bank account validation under Singapore MAS guidelines"
    ];
  };

  const getBlindSpot = () => {
    if (insight?.contradictions && insight.contradictions.length > 0) {
      return { 
        title: "Strategic Trade-off", 
        detail: insight.contradictions[0].tradeoff || insight.contradictions[0].items 
      };
    }
    return { 
      title: "Regulatory Blind Spot", 
      detail: "Balancing fast developer feedback speed with slower legal entity registration frameworks." 
    };
  };

  const getSuggestedAction = () => {
    if (insight?.actionItems && insight.actionItems.length > 0) {
      return insight.actionItems[0].task;
    }
    return "Retain a local corporate secretary partner to initiate ACRA e-lodgement.";
  };

  const handleSpeakItem = (text: string) => {
    onSpeak(text);
  };

  return (
    <div className="relative h-full flex" id="jarvis_analytics_root">
      {/* Absolute toggle button outside panel */}
      <button
        onClick={onToggle}
        className="absolute top-20 -left-10 z-30 p-2 bg-slate-900 text-white rounded-l-xl shadow-lg border-y border-l border-slate-700 flex items-center justify-center hover:bg-slate-800 transition cursor-pointer"
        title={isOpen ? "Collapse Sage Sidecar" : "Expand Sage Sidecar"}
        id="jarvis_panel_toggle_button"
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Main Sidecar Panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 440, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="h-full bg-slate-50/60 text-slate-900 border-l border-slate-200 flex flex-col overflow-hidden select-none shadow-premium relative"
            id="jarvis_analytics_container"
          >
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-200/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold font-display tracking-tight text-slate-900">
                    Sage Advisory Board
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Strategic Decision Engine</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isSpeaking) {
                    if (onStopSpeaking) onStopSpeaking();
                  } else {
                    const textToRead = insight?.shortResponse || "Sage is ready to analyze your brainstorm. Click Sync Sage below.";
                    handleSpeakItem(textToRead);
                  }
                }}
                className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-102 ${
                  isSpeaking
                    ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs hover:shadow-sm"
                }`}
                title={isSpeaking ? "Stop Voice" : "Listen to Sage"}
                id="speak_sage_recommendation_button"
              >
                {isSpeaking ? <Square className="w-4 h-4 fill-current animate-pulse text-rose-600" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

            {/* ANALYSIS Section Header & Actions */}
            <div className="px-6 py-5 bg-white border-b border-slate-100 flex flex-col gap-3.5 relative z-10 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                  Analysis & Actions
                </span>
                {isSpeaking && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider animate-pulse">Voice active</span>
                    <div className="flex gap-0.5 h-2.5 items-center">
                      <span className="w-0.5 bg-slate-600 rounded-full animate-wave-bar-1 h-1.5"></span>
                      <span className="w-0.5 bg-slate-600 rounded-full animate-wave-bar-2 h-2.5"></span>
                      <span className="w-0.5 bg-slate-600 rounded-full animate-wave-bar-3 h-1"></span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions: Sync Sage (full width) */}
              <div className="w-full">
                <button
                  onClick={() => onTriggerAnalyze()}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-400"
                  id="run_jarvis_quick_button"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? "Syncing..." : "Sync Sage"}</span>
                </button>
              </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
                    <Sparkles className="w-5 h-5 text-slate-800 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">Processing Brainstorm...</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Generating boardroom insights & metrics</p>
                  </div>
                </div>
              ) : insight ? (
                <>
                  {/* Dynamic Fallback/Quota Alert Banner */}
                  {insight.fallbackActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50/75 border border-amber-200/80 text-amber-800 px-4 py-3 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-2.5 shadow-2xs"
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <div className="leading-tight flex-1 font-bold">
                        Local Advisory Fallback Active • Live Quota Exhausted
                      </div>
                    </motion.div>
                  )}

                  {/* Instant 5-Dimension Strategy Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-slate-800 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden"
                    id="instant_five_dimension_strategy_card"
                  >
                    {/* Background glow lines */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <h4 className="text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest">
                          Sage 5-Dimension Strategy Card
                        </h4>
                      </div>
                      <span className="text-[8px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                        Instant WOW
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Dimension 1: Estimated Cost Range */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Estimated Cost Range</span>
                        </div>
                        <p className="text-xs font-bold font-mono text-emerald-300">
                          {getCostRange().value}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans italic">
                          {getCostRange().context}
                        </p>
                      </div>

                      {/* Dimension 2: Timeline & Risk Flag */}
                      <div className="space-y-1 border-t border-slate-800/40 pt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Timeline & Risk Flag</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200">
                            {getTimelineRisk().timeline}
                          </span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                            HIGH RISK
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans">
                          <span className="font-bold text-slate-300">Flag:</span> {getTimelineRisk().risk}
                        </p>
                      </div>

                      {/* Dimension 3: Key Dependencies */}
                      <div className="space-y-1 border-t border-slate-800/40 pt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
                          <span>Key Dependencies</span>
                        </div>
                        <ul className="space-y-1">
                          {getKeyDependencies().map((dep, idx) => (
                            <li key={idx} className="text-[10px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                              <span className="leading-tight">{dep}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dimension 4: Contradiction or Blind Spot */}
                      <div className="space-y-1 border-t border-slate-800/40 pt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider">
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                          <span>Blind Spot / Contradiction</span>
                        </div>
                        <p className="text-[10px] font-bold text-rose-300 font-sans">
                          {getBlindSpot().title}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans">
                          {getBlindSpot().detail}
                        </p>
                      </div>

                      {/* Dimension 5: Suggested First Action */}
                      <div className="space-y-1.5 border-t border-slate-800/40 pt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-blue-400 uppercase tracking-wider">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span>Suggested First Action</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-lg text-xs font-semibold text-blue-200 font-sans leading-relaxed flex items-start gap-2">
                          <span className="text-blue-400 font-mono mt-0.5">➔</span>
                          <span>{getSuggestedAction()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Proactive Co-Founder Observation Card */}
                  {insight.proactiveInsight && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-indigo-50/60 border border-indigo-100/80 p-5 rounded-2xl relative overflow-hidden shadow-2xs group hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-300"
                      id="sage_proactive_observation_card"
                    >
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-indigo-100/50 text-indigo-800 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shrink-0" />
                        Sage Observation
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <h4 className="text-[10px] font-bold text-indigo-900 uppercase font-mono tracking-widest mb-1.5">
                            Proactive Partner Insight
                          </h4>
                          <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
                            "{insight.proactiveInsight}"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Executive Advisor Short Statement */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-slate-900 text-white p-6 rounded-2xl shadow-premium border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 p-2 text-[9px] bg-slate-850 text-slate-300 rounded-bl-xl font-mono font-bold tracking-wider uppercase">
                      Core Brief
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">
                          Live Advisor Insight
                        </h4>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans italic mb-4">
                          "{insight.shortResponse}"
                        </p>

                        {/* Vote Controls */}
                        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                            Helpful co-founder advice?
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (votedStatus === "up") {
                                  setVotedStatus(null);
                                  setUpvotes((v) => v - 1);
                                } else {
                                  if (votedStatus === "down") {
                                    setDownvotes((v) => v - 1);
                                  }
                                  setVotedStatus("up");
                                  setUpvotes((v) => v + 1);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                votedStatus === "up"
                                  ? "bg-slate-100 text-slate-900 shadow-sm"
                                  : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                              }`}
                              title="Upvote Advisor Advice"
                              id="upvote_insight_button"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{upvotes}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (votedStatus === "down") {
                                  setVotedStatus(null);
                                  setDownvotes((v) => v - 1);
                                } else {
                                  if (votedStatus === "up") {
                                    setUpvotes((v) => v - 1);
                                  }
                                  setVotedStatus("down");
                                  setDownvotes((v) => v + 1);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                votedStatus === "down"
                                  ? "bg-slate-100 text-slate-900 shadow-sm"
                                  : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                              }`}
                              title="Downvote Advisor Advice"
                              id="downvote_insight_button"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>{downvotes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* SWOT Analysis Section */}
                  {insight.swot && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.05 }}
                      className="space-y-3"
                      id="swot_analysis_section"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold font-mono text-slate-450 uppercase tracking-widest">
                          Strategic SWOT Matrix
                        </h4>
                        <span className="text-[9px] bg-slate-200/50 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                          Audited
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Strengths */}
                        <div className="bg-white border border-slate-100 p-4 rounded-xl space-y-2 hover:shadow-premium transition-all duration-200">
                          <h5 className="text-[10px] font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Strengths (S)
                          </h5>
                          <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed font-sans">
                            {insight.swot.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-white border border-slate-100 p-4 rounded-xl space-y-2 hover:shadow-premium transition-all duration-200">
                          <h5 className="text-[10px] font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Weaknesses (W)
                          </h5>
                          <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed font-sans">
                            {insight.swot.weaknesses.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Opportunities */}
                        <div className="bg-white border border-slate-100 p-4 rounded-xl space-y-2 hover:shadow-premium transition-all duration-200">
                          <h5 className="text-[10px] font-bold font-mono text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Opportunities (O)
                          </h5>
                          <ul className="space-y-1 text-[11px] text-emerald-950/80 list-disc pl-4 leading-relaxed font-sans">
                            {insight.swot.opportunities.map((o, idx) => (
                              <li key={idx}>{o}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Threats */}
                        <div className="bg-white border border-slate-100 p-4 rounded-xl space-y-2 hover:shadow-premium transition-all duration-200">
                          <h5 className="text-[10px] font-bold font-mono text-rose-850 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Threats (T)
                          </h5>
                          <ul className="space-y-1 text-[11px] text-rose-950/80 list-disc pl-4 leading-relaxed font-sans">
                            {insight.swot.threats.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Decision Analytics */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold font-mono text-slate-450 uppercase tracking-widest">
                        Decision Analytics
                      </h4>
                      <span className="text-[9px] bg-slate-200/50 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                        Live Metrics
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {insight.decisionAnalytics && insight.decisionAnalytics.length > 0 ? (
                        insight.decisionAnalytics.map((metric, index) => (
                          <div
                            key={index}
                            className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-premium flex items-center justify-between hover:border-slate-350 transition-all duration-200 hover:-translate-y-0.5"
                          >
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                                {metric.metric}
                              </p>
                              <p className="text-xs text-slate-800 font-semibold font-sans">{metric.context}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-4">
                              <span className="text-sm font-bold font-mono text-emerald-600 flex items-center gap-0.5">
                                <TrendingDown className="w-3.5 h-3.5" />
                                {metric.value}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">optimized</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 italic py-4 bg-white border border-slate-100 rounded-xl text-center font-mono">
                          No metrics generated. Mentions of pricing or scaling will update this live.
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Strategic Themes Grouping */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                    className="space-y-3"
                  >
                    <h4 className="text-[10px] font-bold font-mono text-slate-450 uppercase tracking-widest">
                      Strategic Themes
                    </h4>
                    <div className="space-y-3">
                      {insight.themes && insight.themes.length > 0 ? (
                        insight.themes.map((themeObj, index) => (
                          <div key={index} className="p-5 bg-white rounded-xl border border-slate-200/85 shadow-premium space-y-3 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold font-display text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />
                                {themeObj.theme}
                              </span>
                              <span className="text-[9px] font-mono text-slate-450 uppercase tracking-wider">Theme Audit</span>
                            </div>
                            <div className="space-y-2.5 text-xs">
                              <div>
                                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Direct Claim</span>
                                <p className="text-slate-700 font-medium pl-3 border-l-2 border-slate-200 leading-relaxed">"{themeObj.whatWasSaid}"</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Strategic Meaning</span>
                                <p className="text-slate-600 pl-3 border-l-2 border-slate-200 leading-relaxed">{themeObj.whatItMeans}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold font-mono text-rose-500 uppercase tracking-wider block mb-0.5">Blindspot & Risk</span>
                                <p className="text-rose-800 pl-3 border-l-2 border-rose-100 leading-relaxed font-sans bg-rose-50/20 py-0.5 pr-1">{themeObj.whatCouldGoWrong}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold font-mono text-amber-600 uppercase tracking-wider block mb-0.5">Unresolved Deficit</span>
                                <p className="text-amber-800 pl-3 border-l-2 border-amber-100 leading-relaxed">{themeObj.whatsMissing}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 italic py-4 bg-white border border-slate-100 rounded-xl text-center font-mono">
                          Themes will populate as core strategy elements are drafted.
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Explicit Contradictions */}
                  {insight.contradictions && insight.contradictions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.2 }}
                      className="space-y-3"
                    >
                      <h4 className="text-[10px] font-bold font-mono text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Explicit Contradictions
                      </h4>
                      <div className="space-y-3">
                        {insight.contradictions.map((contra, index) => (
                          <div key={index} className="p-5 bg-white border border-rose-100/80 rounded-xl shadow-premium space-y-2 hover:-translate-y-0.5 transition-all duration-200">
                            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px] font-mono uppercase tracking-wider">
                              <span>⚠️ CONFLICT:</span>
                              <span className="text-slate-800 font-sans font-semibold normal-case">{contra.items}</span>
                            </div>
                            <div className="text-xs text-slate-600 pl-4 leading-relaxed font-sans border-l-2 border-rose-200">
                              <span className="font-semibold text-slate-900 block mb-0.5">Strategic Trade-off:</span>
                              {contra.tradeoff}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Executive Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.22 }}
                    className="space-y-3"
                  >
                    <h4 className="text-[10px] font-bold font-mono text-slate-450 uppercase tracking-widest">
                      Strategic Summary
                    </h4>
                    <p className="text-xs text-slate-750 leading-relaxed font-sans bg-white p-5 rounded-xl border border-slate-200/60 shadow-premium">
                      {insight.summary}
                    </p>
                  </motion.div>

                  {/* Action Items */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.25 }}
                    className="space-y-3"
                  >
                    <h4 className="text-[10px] font-bold font-mono text-slate-450 uppercase tracking-widest">
                      Action Items
                    </h4>
                    <div className="space-y-3">
                      {insight.actionItems && insight.actionItems.length > 0 ? (
                        insight.actionItems.map((item, index) => {
                          const priorityColor =
                            item.priority.toLowerCase() === "high"
                              ? "text-rose-600 bg-rose-50 border-rose-100"
                              : item.priority.toLowerCase() === "medium"
                              ? "text-amber-750 bg-amber-50/50 border-amber-100"
                              : "text-emerald-600 bg-emerald-50 border-emerald-100";
                          return (
                            <div
                              key={index}
                              className="p-4 bg-white rounded-xl border border-slate-200 shadow-premium flex items-start justify-between gap-3 hover:border-slate-350 transition-all duration-200 hover:-translate-y-0.5"
                            >
                              <div className="space-y-1.5">
                                <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium flex gap-2 items-start">
                                  <CheckSquare className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                  {item.task}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono pl-5.5 flex items-center gap-1.5">
                                  <CornerDownRight className="w-2.5 h-2.5 text-slate-300" />
                                  Lead: <span className="text-slate-600 font-semibold">{item.assignee}</span>
                                </p>
                              </div>
                              <span className={`text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full border shrink-0 font-semibold tracking-wider ${priorityColor}`}>
                                {item.priority}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic py-4 bg-white border border-slate-100 rounded-xl text-center font-mono">No action items found.</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Highlighted Risks */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.28 }}
                    className="space-y-3"
                  >
                    <h4 className="text-[10px] font-bold font-mono text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Highlighted Risks & Blindspots
                    </h4>
                    <div className="space-y-2 bg-white p-5 rounded-xl border border-rose-100 shadow-premium">
                      {insight.risks && insight.risks.length > 0 ? (
                        insight.risks.map((risk, index) => (
                          <div key={index} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed font-sans py-0.5">
                            <span className="text-rose-550 shrink-0 font-bold">•</span>
                            <p>{risk}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2 text-center font-mono">No critical risks flagged.</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Factors That Change */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.3 }}
                    className="space-y-3"
                  >
                    <h4 className="text-[10px] font-bold font-mono text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Shifting Variables & Factors
                    </h4>
                    <div className="space-y-2 bg-white p-5 rounded-xl border border-slate-200 shadow-premium">
                      {insight.changingFactors && insight.changingFactors.length > 0 ? (
                        insight.changingFactors.map((factor, index) => (
                          <div key={index} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed font-sans py-0.5">
                            <span className="text-slate-400 shrink-0 font-bold">•</span>
                            <p>{factor}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2 text-center font-mono">No major variable shifts detected.</p>
                      )}
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 text-slate-500 bg-white border border-slate-100 rounded-2xl p-6 shadow-premium">
                  <Sparkles className="w-6 h-6 text-slate-450 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-450 uppercase tracking-wider">Awaiting Brainstorm Sync</h4>
                    <p className="text-[10px] font-mono mt-1 text-slate-400">Click Sync Sage to generate elite analysis</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Status */}
            <div className="p-5 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold font-sans">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping"></div>
                <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">Sage Live telemetry active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

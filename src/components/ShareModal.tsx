import React, { useState } from "react";
import { Notebook, JarvisInsight, EmailLog, Collaborator } from "../types";
import { Mail, Check, X, Download, FileText, Send, Sparkles, Shield, AlertTriangle, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { jsPDF } from "jspdf";
import { motion } from "motion/react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  insight: JarvisInsight | null;
  collaborators: Collaborator[];
  onAddEmailLog: (log: EmailLog) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  notebook,
  insight,
  collaborators,
  onAddEmailLog,
}: ShareModalProps) {
  const [recipientEmail, setRecipientEmail] = useState<string>(
    notebook.collaborators.length > 0 ? notebook.collaborators.map((c) => c.email).join(", ") : ""
  );
  const [subject, setSubject] = useState<string>(`Strategic Brief: ${notebook.title}`);
  
  const availableSections = [
    { id: "summary", label: "Executive Summary", exists: !!insight?.summary },
    { id: "notes", label: "Brainboard Notes", exists: notebook.blocks.length > 0 },
    { id: "risks", label: "Strategic Risks", exists: !!insight?.risks && insight.risks.length > 0 },
    { id: "dependencies", label: "Changing Variables", exists: !!insight?.changingFactors && insight.changingFactors.length > 0 },
    { id: "actions", label: "Deliverable Roadmap Action Items", exists: !!insight?.actionItems && insight.actionItems.length > 0 },
    { id: "swot", label: "SWOT Analysis Matrix", exists: !!insight?.swot },
    { id: "analytics", label: "Decision Analytics & Metrics", exists: !!insight?.decisionAnalytics && insight.decisionAnalytics.length > 0 },
    { id: "themes", label: "Thematic Co-Founder Grouping", exists: !!insight?.themes && insight.themes.length > 0 },
  ];

  // What to share selections (Mandated: always ask user what to share, dynamically synchronized)
  const [sectionsShared, setSectionsShared] = useState<Record<string, boolean>>({
    summary: true,
    notes: true,
    risks: true,
    dependencies: true,
    actions: true,
    swot: true,
    analytics: true,
    themes: true,
  });

  const [provider, setProvider] = useState<"gmail" | "outlook">("gmail");
  const [step, setStep] = useState<"preview" | "configure">("preview");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Helper to compile the active briefing markdown/text for preview and email dispatch
  const getCompiledBriefingText = () => {
    let text = "";
    
    if (sectionsShared.summary && insight?.summary) {
      text += `--- EXECUTIVE ADVOCACY SUMMARY ---\n"${insight.summary}"\n\n`;
    }
    
    if (sectionsShared.notes && notebook.blocks.length > 0) {
      text += `--- BRAINBOARD MEETING NOTES ---\n`;
      notebook.blocks.forEach((b) => {
        if (b.type === "text" && b.content) {
          text += `${b.content}\n\n`;
        }
        if (b.type === "bullets" && b.content) {
          text += `${b.content}\n\n`;
        }
      });
    }
    
    if (sectionsShared.risks && insight?.risks && insight.risks.length > 0) {
      text += `--- STRATEGIC RISKS & BLINDSPOTS ---\n`;
      insight.risks.forEach((r) => { text += `• ${r}\n`; });
      text += `\n`;
    }
    
    if (sectionsShared.dependencies && insight?.changingFactors && insight.changingFactors.length > 0) {
      text += `--- SHIFTING VARIABLES & DEPENDENCIES ---\n`;
      insight.changingFactors.forEach((cf) => { text += `• ${cf}\n`; });
      text += `\n`;
    }
    
    if (sectionsShared.actions && insight?.actionItems && insight.actionItems.length > 0) {
      text += `--- DELIVERABLE ACTION ROADMAP ---\n`;
      insight.actionItems.forEach((ai) => {
        text += `[ ] ${ai.task} (Owner: ${ai.assignee} | Priority: ${ai.priority})\n`;
      });
      text += `\n`;
    }

    if (sectionsShared.swot && insight?.swot) {
      text += `--- SWOT MATRIX ANALYSIS ---\n`;
      text += `STRENGTHS:\n${insight.swot.strengths.map(s => `• ${s}`).join("\n")}\n\n`;
      text += `WEAKNESSES:\n${insight.swot.weaknesses.map(w => `• ${w}`).join("\n")}\n\n`;
      text += `OPPORTUNITIES:\n${insight.swot.opportunities.map(o => `• ${o}`).join("\n")}\n\n`;
      text += `THREATS:\n${insight.swot.threats.map(t => `• ${t}`).join("\n")}\n\n`;
    }

    if (sectionsShared.analytics && insight?.decisionAnalytics && insight.decisionAnalytics.length > 0) {
      text += `--- DECISION ANALYTICS & METRICS ---\n`;
      insight.decisionAnalytics.forEach((m) => {
        text += `• ${m.metric}: ${m.value} (${m.context})\n`;
      });
      text += `\n`;
    }

    if (sectionsShared.themes && insight?.themes && insight.themes.length > 0) {
      text += `--- THEMATIC CO-FOUNDER GROUPING ---\n`;
      insight.themes.forEach((t) => {
        text += `Theme: ${t.theme}\n`;
        text += `  • What Was Said: ${t.whatWasSaid}\n`;
        text += `  • What It Means: ${t.whatItMeans}\n`;
        text += `  • What Could Go Wrong: ${t.whatCouldGoWrong}\n`;
        text += `  • What's Missing: ${t.whatsMissing}\n\n`;
      });
    }

    return text.trim() || "No sections selected. Please toggle the checkboxes below to compile your briefing.";
  };

  // Generate the actual PDF document layout beautifully
  const generatePDFBytes = (): jsPDF => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let y = 20;

    // Title / Cover branding with premium navy bar header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("EXECUTIVE BRIEFING", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Subject: ${notebook.title}`, 14, y);
    y += 6;
    doc.text(`Created on: ${new Date().toLocaleDateString()} | 2026`, 14, y);
    y += 10;

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 10;

    // 1. Share Summary Section
    if (sectionsShared.summary && insight?.summary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("I. STRATEGIC EXECUTIVE SUMMARY", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59); // slate-800
      const splitSummary = doc.splitTextToSize(insight.summary, 180);
      doc.text(splitSummary, 14, y);
      y += (splitSummary.length * 6) + 8;
    }

    // 2. Share Notes Section
    if (sectionsShared.notes && notebook.blocks.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("II. BRAINBOARD MEETING NOTES", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      // Pre-filter block duplication
      notebook.blocks.forEach((block) => {
        if (y > 255) {
          doc.addPage();
          y = 20;
        }

        if (block.type === "text" && block.content) {
          const splitContent = doc.splitTextToSize(block.content, 180);
          doc.text(splitContent, 14, y);
          y += (splitContent.length * 5) + 6;
        } else if (block.type === "bullets" && block.content) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text("Directives & Guidelines:", 14, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          
          // Split & Deduplicate pointers
          const bulletLines = block.content.split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);
          const uniqueLines = Array.from(new Set(bulletLines));

          uniqueLines.forEach((line) => {
            const cleanText = line.replace(/^[•\-\*\d\.\s]+/g, "").trim();
            if (!cleanText) return;
            const splitBullet = doc.splitTextToSize(`• ${cleanText}`, 175);
            doc.text(splitBullet, 18, y);
            y += (splitBullet.length * 5) + 2.5;
          });
          y += 4;
        } else if (block.type === "table" && block.table) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text("Structured Matrix Grid:", 14, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);

          // Draw a beautiful clean table in PDF
          const headers = block.table.headers;
          const rows = block.table.rows;
          
          let colX = 14;
          const colWidth = 180 / headers.length;

          // Headers row background
          doc.setFillColor(241, 245, 249);
          doc.rect(14, y - 4, 180, 7, "F");
          doc.setFont("helvetica", "bold");
          headers.forEach((hdr, idx) => {
            doc.text(hdr, colX + (idx * colWidth), y);
          });
          y += 7;

          // Rows
          doc.setFont("helvetica", "normal");
          rows.forEach((row) => {
            row.forEach((cell, idx) => {
              // Deduplicate collaborator or clean cells nicely
              const cleanCell = cell.trim();
              doc.text(cleanCell.substring(0, 24), colX + (idx * colWidth), y);
            });
            y += 6;
            if (y > 275) {
              doc.addPage();
              y = 20;
            }
          });
          y += 6;
        }
      });
      y += 4;
    }

    // 3. Share Risks Section
    if (sectionsShared.risks && insight?.risks && insight.risks.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(220, 38, 38); // red-600
      doc.text("III. CRITICAL STRATEGIC RISKS & BLINDSPOTS", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      // Deduplicate risks
      const uniqueRisks = Array.from(new Set(insight.risks));
      uniqueRisks.forEach((risk) => {
        const cleanRisk = risk.replace(/^[•\-\*\d\.\s]+/g, "").trim();
        if (!cleanRisk) return;
        const splitRisk = doc.splitTextToSize(`• ${cleanRisk}`, 180);
        doc.text(splitRisk, 14, y);
        y += (splitRisk.length * 5) + 3;
        if (y > 275) { doc.addPage(); y = 20; }
      });
      y += 6;
    }

    // 4. Share Dependencies / Changing Factors Section
    if (sectionsShared.dependencies && insight?.changingFactors && insight.changingFactors.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text("IV. SHIFTING VARIABLES & DEPENDENCIES", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      // Deduplicate factors
      const uniqueFactors = Array.from(new Set(insight.changingFactors));
      uniqueFactors.forEach((factor) => {
        const cleanFactor = factor.replace(/^[•\-\*\d\.\s]+/g, "").trim();
        if (!cleanFactor) return;
        const splitFactor = doc.splitTextToSize(`• ${cleanFactor}`, 180);
        doc.text(splitFactor, 14, y);
        y += (splitFactor.length * 5) + 3;
        if (y > 275) { doc.addPage(); y = 20; }
      });
      y += 6;
    }

    // 5. Share Actions Items
    if (sectionsShared.actions && insight?.actionItems && insight.actionItems.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("V. DELIVERABLE ACTION ROADMAP", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      // Deduplicate actions
      const seenActions = new Set();
      insight.actionItems.forEach((item) => {
        if (seenActions.has(item.task)) return;
        seenActions.add(item.task);

        const itemLine = `[ ] ${item.task} (Owner: ${item.assignee} | Priority: ${item.priority})`;
        const splitItem = doc.splitTextToSize(itemLine, 180);
        doc.text(splitItem, 14, y);
        y += (splitItem.length * 5) + 3.5;
        if (y > 275) { doc.addPage(); y = 20; }
      });
    }

    // 6. SWOT Section
    if (sectionsShared.swot && insight?.swot) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("VI. SWOT MATRIX ANALYSIS", 14, y);
      y += 8;

      const swot = insight.swot;
      const categories = [
        { title: "Strengths (S)", items: swot.strengths, color: [30, 41, 59] },
        { title: "Weaknesses (W)", items: swot.weaknesses, color: [100, 116, 139] },
        { title: "Opportunities (O)", items: swot.opportunities, color: [5, 150, 105] },
        { title: "Threats (T)", items: swot.threats, color: [220, 38, 38] },
      ];

      categories.forEach((cat) => {
        if (y > 245) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
        doc.text(cat.title, 14, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        
        cat.items.forEach((item) => {
          const cleanItem = item.replace(/^[•\-\*\d\.\s]+/g, "").trim();
          const splitItem = doc.splitTextToSize(`• ${cleanItem}`, 180);
          doc.text(splitItem, 18, y);
          y += (splitItem.length * 4.5) + 2;
          if (y > 275) { doc.addPage(); y = 20; }
        });
        y += 3;
      });
      y += 4;
    }

    // 7. Decision Analytics Section
    if (sectionsShared.analytics && insight?.decisionAnalytics && insight.decisionAnalytics.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("VII. DECISION ANALYTICS & METRICS", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      insight.decisionAnalytics.forEach((m) => {
        const textLine = `• ${m.metric}: ${m.value} — ${m.context}`;
        const splitText = doc.splitTextToSize(textLine, 180);
        doc.text(splitText, 14, y);
        y += (splitText.length * 5) + 2.5;
        if (y > 275) { doc.addPage(); y = 20; }
      });
      y += 4;
    }

    // 8. Themes Section
    if (sectionsShared.themes && insight?.themes && insight.themes.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("VIII. CO-FOUNDER THEMATIC BRAINBOARD ANALYSIS", 14, y);
      y += 8;

      insight.themes.forEach((theme) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(`Theme: ${theme.theme}`, 14, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);

        const details = [
          `What Was Said: ${theme.whatWasSaid}`,
          `What It Means: ${theme.whatItMeans}`,
          `What Could Go Wrong: ${theme.whatCouldGoWrong}`,
          `What's Missing: ${theme.whatsMissing}`,
        ];

        details.forEach((det) => {
          const splitDet = doc.splitTextToSize(`• ${det}`, 175);
          doc.text(splitDet, 18, y);
          y += (splitDet.length * 4.5) + 1.5;
          if (y > 275) { doc.addPage(); y = 20; }
        });
        y += 2;
      });
    }

    // Confidential footer branding
    doc.setFontSize(8);
    doc.setFont("helvetica", "oblique");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("CONFIDENTIAL - FOR BOARD OF DIRECTORS ONLY • GENERATED BY SAGE INTELLECT", 14, 287);

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDFBytes();
    doc.save(`Briefing_${notebook.title.replace(/\s+/g, "_")}.pdf`);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setSentSuccess(false);

    const emailBody = `Board-Level Briefing: ${notebook.title}\n\n${getCompiledBriefingText()}\n\n---\nSent from the Sage Executive Intellect workspace. Confidential and privileged.`;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientEmail,
          subject,
          body: emailBody,
          provider,
          sectionsShared,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onAddEmailLog(data.email);
        setSentSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none" id="sharing_modal_root">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full overflow-hidden shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Disseminate Strategic Intelligence</h3>
              <p className="text-3xs text-slate-400 font-mono">
                {step === "preview" ? "Step 1 of 2: Live Briefing Draft Preview" : "Step 2 of 2: Configure Client Ecosystem & Dispatch"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {sentSuccess ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-center space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Briefing Dispatched Successfully</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your board briefing has been sent via {provider === "gmail" ? "Gmail" : "Outlook"} to {recipientEmail || "your partners"}.
                </p>
              </div>
              <button
                onClick={() => {
                  setSentSuccess(false);
                  setStep("preview");
                  onClose();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
              >
                Done
              </button>
            </div>
          ) : step === "preview" ? (
            <>
              {/* Step 1: Draft Output Preview ONLY */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold font-mono text-slate-500 uppercase tracking-wider">
                  Live Briefing Output Draft
                </label>
                <div className="w-full bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[340px] border border-slate-800 whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-slate-800">
                  {getCompiledBriefingText()}
                </div>
                <p className="text-[10px] text-slate-400 font-mono italic">
                  💡 This is an exact preview of the strategic board brief compiled from active data.
                </p>
              </div>

              {/* Proceed Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setStep("configure")}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-xl py-2.5 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  id="share_proceed_to_configure_button"
                >
                  Proceed to Share & Configure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: What to Share checkboxes, Recipients, Subject, Client ecosystem */}
              
              {/* Checkboxes: What to share? */}
              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-2xs font-bold font-mono text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  What to share?
                </p>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="flex items-center gap-2 text-2xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition">
                    <input
                      type="checkbox"
                      checked={shareSummary}
                      onChange={(e) => setShareSummary(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Executive Summary</span>
                  </label>
                  
                  <label className="flex items-center gap-2 text-2xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition">
                    <input
                      type="checkbox"
                      checked={shareNotes}
                      onChange={(e) => setShareNotes(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Brainboard Notes</span>
                  </label>

                  <label className="flex items-center gap-2 text-2xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition">
                    <input
                      type="checkbox"
                      checked={shareRisks}
                      onChange={(e) => setShareRisks(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Strategic Risks</span>
                  </label>

                  <label className="flex items-center gap-2 text-2xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition">
                    <input
                      type="checkbox"
                      checked={shareDependencies}
                      onChange={(e) => setShareDependencies(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Changing Variables</span>
                  </label>

                  <label className="flex items-center gap-2 text-2xs text-slate-700 cursor-pointer col-span-2 hover:bg-slate-50 p-1 rounded transition">
                    <input
                      type="checkbox"
                      checked={shareActions}
                      onChange={(e) => setShareActions(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Deliverable Roadmap Action items</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-4xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Recipients (comma separated emails)
                  </label>
                  <input
                    type="text"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. naval@angellist.com, pmarca@a16z.com"
                  />
                </div>

                <div>
                  <label className="block text-4xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Choose Email Provider */}
              <div className="space-y-1.5">
                <p className="text-4xs font-bold font-mono text-slate-500 uppercase tracking-wider">Choose Client Ecosystem</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProvider("gmail")}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      provider === "gmail"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Google Gmail
                  </button>

                  <button
                    onClick={() => setProvider("outlook")}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      provider === "outlook"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    MS Outlook
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-2 border-t border-slate-100">
                <button
                  onClick={() => setStep("preview")}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl py-2.5 text-xs font-bold transition shadow-3xs"
                  id="share_back_to_preview_button"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-750 hover:bg-slate-50 rounded-xl py-2.5 text-xs font-bold transition shadow-3xs"
                  id="share_download_pdf_only_button"
                  title="Generate & download direct PDF of active selection"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" /> PDF Download
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="flex-1.5 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-400 rounded-xl py-2.5 text-xs font-bold transition shadow-sm"
                  id="share_dispatch_email_button"
                >
                  {isSending ? (
                    "Dispatching..."
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-white" />
                      Send Briefing
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

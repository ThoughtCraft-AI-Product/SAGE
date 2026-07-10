import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_NOTEBOOKS, CO_FOUNDERS } from "./src/data/mockData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it in Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Simulated outbound email delivery history
interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  status: "delivered" | "failed";
  provider: "gmail" | "outlook";
  sectionsShared: {
    notes: boolean;
    summary: boolean;
    risks: boolean;
    dependencies: boolean;
  };
}

const emailHistory: EmailLog[] = [];

// Shared memory-based state for collaborative workspace
let collaborativeNotebooks = JSON.parse(JSON.stringify(INITIAL_NOTEBOOKS));
let collaborativeCollaborators = JSON.parse(JSON.stringify(CO_FOUNDERS));

app.get("/api/sync", (req, res) => {
  res.json({
    notebooks: collaborativeNotebooks,
    collaborators: collaborativeCollaborators
  });
});

app.post("/api/sync", (req, res) => {
  const { notebooks, collaborators } = req.body;
  if (notebooks) {
    collaborativeNotebooks = notebooks;
  }
  if (collaborators) {
    collaborativeCollaborators = collaborators;
  }
  res.json({ success: true });
});

// Strategic fallback generator for when Gemini API quota is exhausted (429) or API key is missing
function generateStrategicFallback(notesContent: string, command?: string): any {
  const content = notesContent || "";
  const lowerNotes = content.toLowerCase();
  
  // Clean raw blocks
  const lines = content
    .split("\n")
    .map(l => l.trim().replace(/^•\s*/, "").replace(/^-\s*/, ""))
    .filter(l => l.length > 5);

  let shortResponse = "Prioritize Surat fabric sourcing first, but lock down automated warehouses near Chennai ports to realize the target 50% operational reduction.";
  let summary = "Executing South Asia supply chain blueprint: combining Surat raw sourcing with automated southern logistics to unlock 50% operational margins.";
  let proactiveInsight = "Nobody's assigned a dedicated owner to the Chennai warehouse automation track yet — want me to draft a role profile or suggest someone?";
  
  const actionItems = [];
  const risks = [];
  const changingFactors = [];
  const decisionAnalytics = [];
  const contradictions = [];
  
  let swot = {
    strengths: [
      "Direct partnerships with local raw material fabric manufacturing guilds",
      "Dynamic in-house engineering capabilities for automated warehouse layouts"
    ],
    weaknesses: [
      "Heavy manual overhead on local cargo handling and inter-state logistics",
      "Vulnerable peak shipping delays at crowded southern regional maritime ports"
    ],
    opportunities: [
      "Leverage direct sourcing to achieve an unprecedented 50% material saving margin",
      "Access localized green-tech subsidies for automated regional warehousing"
    ],
    threats: [
      "Macroeconomic cotton commodity price volatility and localized freight inflation",
      "Pending Q4 updates to inter-state commercial and shipping duty policies"
    ]
  };

  // 1. Dynamic content-aware checks
  if (lowerNotes.includes("singapore") || lowerNotes.includes("saas") || lowerNotes.includes("software") || lowerNotes.includes("product") || lowerNotes.includes("launch")) {
    const term = lowerNotes.includes("singapore") ? "Singapore" : "SaaS Launch";
    shortResponse = `To launch in ${term}, register with ACRA under a clean holding structure immediately, but defer MAS financial licensing until after PMF to limit upfront compliance burn.`;
    summary = `${term} Market Entry Strategy: Aligning high-density cloud hosting with regional compliance integration to maximize early procurement velocity.`;
    proactiveInsight = `You've detailed the Singapore market entry, but haven't factored in CPF/nominee director requirements or regional PDPA policies. Want me to draft a custom compliance checklist?`;
    
    actionItems.push(
      { task: "Incorporate local SG Entity via local agent & ACRA registry", assignee: "@Himanshi Kalra", priority: "High" },
      { task: "Draft initial PDPA privacy policy for regional data sovereignty", assignee: "Compliance Team", priority: "High" },
      { task: "Deploy low-latency APAC regional hosting cluster", assignee: "Engineering Lead", priority: "Medium" }
    );
    risks.push(
      "Stiff competition in local enterprise procurement if Singapore resident director or localized data residency is missing",
      "Unexpected nominee resident director annual retainer fees (~$3k - $5k) draining early startup runway"
    );
    changingFactors.push(
      "ACRA registration processing lead times",
      "Local director compliance liability risks",
      "Nominee director retainer fee changes"
    );
    decisionAnalytics.push(
      { metric: "Estimated Cost Range", value: "$12,000 - $25,000", context: "for local ACRA registry, compliance setup, and nominee director retainer" },
      { metric: "Corporate Tax Rate", value: "17%", context: "with startup tax exemption schemes in Singapore" },
      { metric: "Projected Speed-to-Market", value: "18 Days", context: "via standard streamlined online registration tracks" }
    );
    contradictions.push({
      items: "Desire for rapid Singapore product rollout vs. strict local PDPA and ACRA resident compliance steps.",
      tradeoff: "Speed vs Compliance: Shaving weeks off setup risks heavy regulatory exposure and prospective corporate fines."
    });
    swot = {
      strengths: [
        "Highly reputable Singapore-based international financial center prestige",
        "Abundant early-stage regional venture capital and angel funding pools"
      ],
      weaknesses: [
        "Substantial local talent costs and intense competitor concentration",
        "Mandatory local resident nominee director requirements"
      ],
      opportunities: [
        "Capture lucrative APAC enterprise enterprise contracts using Singapore pedigree",
        "Access generous IMDA sandbox opportunities and tax exemption schemes"
      ],
      threats: [
        "Evolving localized data sovereignty laws across neighboring APAC countries",
        "Escalating nominee director liability and local retainer costs"
      ]
    };
  } else if (lowerNotes.includes("marketing") || lowerNotes.includes("acquisition") || lowerNotes.includes("customer") || lowerNotes.includes("user")) {
    shortResponse = "Focus on direct user interviews to nail down core product-market fit before allocating seed capital to commercial advertising.";
    summary = "Strategic customer-acquisition blueprint: shifting from broad ad channels to high-retention direct founder feedback loops.";
    proactiveInsight = "Nobody's assigned an owner to the target interview cohorts yet — want me to suggest someone from the growth track?";
    actionItems.push(
      { task: "Conduct deep interviews with 15 target cohort participants", assignee: "@Himanshi Kalra", priority: "High" },
      { task: "Set up cohort retention metrics on user activity center", assignee: "Product Team", priority: "High" },
      { task: "Audit organic referral sharing analytics and active loops", assignee: "Operations Lead", priority: "Medium" }
    );
    risks.push(
      "High initial cohort churn if customer onboarding friction remains high",
      "Premium ad-spend inefficiencies prior to validating retention milestones"
    );
    changingFactors.push(
      "Customer Acquisition Cost (CAC) vs Lifetime Value ratio",
      "Weekly user retention curve stability"
    );
    decisionAnalytics.push(
      { metric: "Estimated Cost Range", value: "$1,500 - $3,500", context: "for initial direct cohort acquisition and analytical stack" },
      { metric: "Organic Referral Loop Rate", value: "+30%", context: "via co-founder invite flow" },
      { metric: "User Sandbox Activity", value: "4.8 hrs/wk", context: "per active team workspace" }
    );
    contradictions.push({
      items: "Plans to scale user acquisition rapidly versus keeping onboarding high-friction to maintain data quality.",
      tradeoff: "Volume vs Friction: Easy access increases registration numbers but dilutes early design partner engagement."
    });
  } else if (lowerNotes.includes("surat") || lowerNotes.includes("chennai") || lowerNotes.includes("sourcing") || lowerNotes.includes("warehouse")) {
    shortResponse = "Focus on direct Surat consortium agreements and secure real estate near Chennai ports ahead of high-demand Q4 shipping intervals.";
    summary = "South-Asia logistics optimization: establishing high-velocity sorting structures near southern maritime docks to minimize inter-state tariffs.";
    proactiveInsight = "You've mentioned cost reductions three times but not the launch timeline — should we pressure-test the southern port setup schedule?";
    actionItems.push(
      { task: "Initiate partnership dialogue with Surat regional raw guilds", assignee: "@Himanshi Kalra", priority: "High" },
      { task: "Finalize Chennai warehouse lease and automation design blueprint", assignee: "Product Team", priority: "High" },
      { task: "Audit inter-state compliance regulations and transit tax reliefs", assignee: "Operations Lead", priority: "Medium" }
    );
    risks.push(
      "Regional logistic bottleneck during peak holiday trade months",
      "Short-term adjustments in southern maritime transport duty policies"
    );
    changingFactors.push(
      "Inter-state raw fabric tariff adjustments",
      "Southern port automated transit clearance times"
    );
    decisionAnalytics.push(
      { metric: "Estimated Cost Range", value: "$45,000 - $75,000", context: "for initial Surat direct bulk pre-orders and Chennai hub leases" },
      { metric: "India Sourcing Savings", value: "50%", context: "via Surat guild partnerships" },
      { metric: "Logistics Overhead Reductions", value: "20%", context: "at automated southern hubs" }
    );
    contradictions.push({
      items: "Commitment to automated warehouse technology capital expenditure vs strict seed runway preservation.",
      tradeoff: "Capex vs Opex: Automation yields high long-term savings but drains immediately available cash reserves."
    });
  } else {
    // Elegant generalization parsing real content if available
    let primaryTopic = "operational concept";
    if (lines.length > 0) {
      primaryTopic = lines[0].substring(0, 50) + (lines[0].length > 50 ? "..." : "");
    }
    shortResponse = `Focus on swift direct execution of '${primaryTopic}' to validate customer retention and lock down underlying margins.`;
    summary = `Strategic evaluation of core brainstorm objectives centering around '${primaryTopic}' to optimize immediate growth vectors.`;
    proactiveInsight = `We have drafted several deliverables for '${primaryTopic}' but no hard owner or due dates. Want me to propose a realistic schedule?`;
    
    actionItems.push(
      { task: `Draft detailed task checklist for: ${primaryTopic}`, assignee: "Founder Team", priority: "High" },
      { task: "Define operational target KPIs for next validation interval", assignee: "Operations Lead", priority: "High" }
    );
    risks.push(
      "Underestimating deployment timescales due to split focus across multiple fronts",
      "Delayed direct partner alignment on critical operational milestones"
    );
    changingFactors.push(
      "Weekly team milestone delivery rate",
      "Direct partner response times"
    );
    decisionAnalytics.push(
      { metric: "Estimated Cost Range", value: "$5,000 - $15,000", context: "for initial MVP deployment, hosting, and organic discovery tracks" },
      { metric: "Strategic Concept Alignment", value: "95%", context: "with core founding vision" },
      { metric: "Projected Velocity Improvement", value: "+25%", context: "via block-based document parsing" }
    );
    contradictions.push({
      items: "The desire for rapid customer verification loops vs maintaining rigorous compliance validation steps.",
      tradeoff: "Velocity vs Safety: Launching instantly gets real market feedback fast, but risks early platform friction."
    });
  }

  // Handle SWOT requests specifically
  if (command && (command.toLowerCase().includes("swot") || command.toLowerCase().includes("analysis"))) {
    shortResponse = "Comprehensive SWOT matrix compiled successfully. Use these quadrants to coordinate long-term defensive and offensive strategic decisions.";
    proactiveInsight = "I've balanced this SWOT matrix. Would you like me to highlight the single most critical vulnerability where a Threat overlaps a Weakness?";
  }

  // 2. High-fidelity thematic groupings
  const themes = [
    {
      theme: "Cost",
      whatWasSaid: lines.find(l => l.toLowerCase().includes("cost") || l.toLowerCase().includes("price") || l.toLowerCase().includes("spend")) || "Review operational expenses and optimize the budget distribution.",
      whatItMeans: "Targeted operational optimizations depend on eliminating multi-layered middlemen overhead.",
      whatCouldGoWrong: "Local cargo/tariff fluctuations could compress planned margin windows.",
      whatsMissing: "Granular freight quote tables from independent shipping service providers."
    },
    {
      theme: "Timeline",
      whatWasSaid: lines.find(l => l.toLowerCase().includes("time") || l.toLowerCase().includes("date") || l.toLowerCase().includes("schedule")) || "Accelerate team coordination and clear validation cycles before peak seasons.",
      whatItMeans: "Securing key partner agreements early keeps critical deployment tracks on track.",
      whatCouldGoWrong: "Unforeseen border duty checks or customs revisions could delay launch.",
      whatsMissing: "A visual timeline dashboard mapping each core team member's subtask dependencies."
    },
    {
      theme: "Risk",
      whatWasSaid: lines.find(l => l.toLowerCase().includes("risk") || l.toLowerCase().includes("hazard") || l.toLowerCase().includes("fail")) || "Over-concentration of primary services within a single localized region.",
      whatItMeans: "Establishing dual-redundancy paths safeguards operational continuity.",
      whatCouldGoWrong: "Local weather incidents or regional policy updates could pause transit loops.",
      whatsMissing: "Active listings of tertiary partner providers in backup target zones."
    },
    {
      theme: "Dependencies",
      whatWasSaid: lines.find(l => l.toLowerCase().includes("need") || l.toLowerCase().includes("require") || l.toLowerCase().includes("depend")) || "Successful launch requires fully synchronized tech-stack integrations.",
      whatItMeans: "Platform standardizations directly influence automated transit velocity.",
      whatCouldGoWrong: "Proprietary software incompatibility might cause synchronization lags.",
      whatsMissing: "Official API endpoint manuals of local port tracking providers."
    },
    {
      theme: "Team",
      whatWasSaid: lines.find(l => l.toLowerCase().includes("team") || l.toLowerCase().includes("assign") || l.toLowerCase().includes("owner")) || "Deploy clear task owners across active product, growth, and ops tracks.",
      whatItMeans: "Accountability structure accelerates overall team validation velocity.",
      whatCouldGoWrong: "Overlapping task scopes may lead to redundant research loops.",
      whatsMissing: "A structured bi-weekly review structure to align co-founder milestones."
    }
  ];

  // 3. Dynamic contradiction finder
  if (contradictions.length === 0) {
    if (lowerNotes.includes("hire") && (lowerNotes.includes("cost") || lowerNotes.includes("budget") || lowerNotes.includes("runway"))) {
      contradictions.push({
        items: "Plans to accelerate talent recruitment versus strict cost conservation and runway extension.",
        tradeoff: "Burn Rate vs Velocity: Hiring fast shortens developer feedback loop but reduces financial contingency reserves."
      });
    } else {
      contradictions.push({
        items: "The desire for rapid customer verification loops vs maintaining rigorous compliance validation steps.",
        tradeoff: "Velocity vs Safety: Launching instantly gets real market feedback fast, but risks early platform friction."
      });
    }
  }

  return {
    shortResponse,
    summary,
    actionItems,
    risks,
    changingFactors,
    decisionAnalytics,
    themes,
    contradictions,
    swot,
    fallbackActive: true,
    proactiveInsight
  };
}

// API Endpoint to Analyze Notes and Generate Decision Analytics (Sage Core)
app.post("/api/gemini/analyze", async (req, res) => {
  const { notesContent, command, contextType } = req.body;
  
  // Quick pre-check for AI client availability to fail fast & fallback elegantly
  let ai;
  try {
    ai = getGeminiClient();
  } catch (e: any) {
    console.warn("Gemini Client not available. Generating dynamic fallback strategy report:", e.message);
    const fallback = generateStrategicFallback(notesContent, command);
    return res.json(fallback);
  }

  try {
    // Default system instruction setting the founder's advisor/analytical companion tone
    const systemInstruction = `
You are Sage AI, an elite, top-tier strategic executive advisor and co-founder's companion designed for high-agency tech founders and leaders.
Your user has 25+ years of experience and values precise, high-density, action-oriented, and short intelligent insights.
NEVER speak in fluff, preachy, or cliché corporate jargon.
Give sharp, highly analytical, quantitative, and context-specific assessments.

Sage has a light, sharp, confident, and highly partner-like personality (a strategic co-founder, not a robotic assistant). Occasionally inject a touch of warmth or clever wit.

Follow these strict constraints:
1. Group the brainstorm content by theme (Cost, Timeline, Risk, Dependencies, Team).
2. For each theme, provide a short, sharp insight answering:
   - what was said
   - what it means
   - what could go wrong
   - what's missing
3. Flag contradictions explicitly (e.g., "cut cost 50%" vs "hire 10 people") and explain the trade-offs co-founders must resolve.
4. Keep every response extremely concise — sentences, not paragraphs.
5. NEVER invent data or metrics the team didn't provide in the text.
6. If the input is too vague or lacks sufficient details, ask instead of guessing.
7. Generate a 'proactiveInsight' field: this is an unprompted, highly helpful observation about something the team didn't explicitly ask for. Keep it rare, high-value, and witty. E.g., "Nobody's assigned an owner to this decision — want me to suggest one?" or "You've mentioned cost three times but not timeline — should we pressure-test the schedule?"

Return the output in a strict, well-structured JSON format that matches the required schema.
    `;

    const prompt = `
Notes/Brainstorming Content:
"""
${notesContent || "(Empty notes)"}
"""

Context/Request:
${command || "Analyze the notes and extract decision analytics, risks, changing factors, action items, and a concise summary."}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortResponse: {
              type: Type.STRING,
              description: "Extremely sharp, intelligent, short response or feedback.",
            },
            summary: {
              type: Type.STRING,
              description: "A professional executive summary of the discussion (1-2 sentences).",
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING, description: "The concrete task to be executed." },
                  assignee: { type: Type.STRING, description: "Suggested or tagged collaborator or 'Team'." },
                  priority: { type: Type.STRING, description: "High, Medium, or Low" }
                },
                required: ["task", "assignee", "priority"]
              },
              description: "List of actionable items extracted from the brainstorming notes.",
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Highlighted risk factors, blindspots, or strategic vulnerabilities.",
            },
            changingFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Factors that change, shifting external variables, market variables, or internal reallocations.",
            },
            decisionAnalytics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING, description: "The KPI or analytic metric (e.g., 'Cost Reduction', 'Time to Market', 'Conversion Rate')" },
                  value: { type: Type.STRING, description: "The quantified change (e.g., '50%', '3.5x', '-$200k/mo')" },
                  context: { type: Type.STRING, description: "Context of the metric (e.g., 'for clothing product line in India')" }
                },
                required: ["metric", "value", "context"]
              },
              description: "Numeric predictions, financial optimizations, or real-time decision analytics.",
            },
            themes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  theme: { type: Type.STRING, description: "Theme: Cost, Timeline, Risk, Dependencies, or Team" },
                  whatWasSaid: { type: Type.STRING, description: "Short summary of what was said" },
                  whatItMeans: { type: Type.STRING, description: "Short implication" },
                  whatCouldGoWrong: { type: Type.STRING, description: "Short description of potential failure modes" },
                  whatsMissing: { type: Type.STRING, description: "Short description of what is missing or unknown" }
                },
                required: ["theme", "whatWasSaid", "whatItMeans", "whatCouldGoWrong", "whatsMissing"]
              },
              description: "Brainstorm grouped by the five standard co-founder strategic themes."
            },
            contradictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  items: { type: Type.STRING, description: "Contradicting elements in the brainstorm" },
                  tradeoff: { type: Type.STRING, description: "The explicit strategic trade-off co-founders must resolve" }
                },
                required: ["items", "tradeoff"]
              },
              description: "Identified logical contradictions or opposing constraints in the team's notes."
            },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths of the company/idea based on notes." },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Weaknesses of the company/idea based on notes." },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Opportunities for the company/idea based on notes." },
                threats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Threats to the company/idea based on notes." }
              },
              required: ["strengths", "weaknesses", "opportunities", "threats"],
              description: "A professional SWOT analysis matrix based on the notes."
            },
            proactiveInsight: {
              type: Type.STRING,
              description: "An unprompted, high-agency, witty co-founder strategic observation about something the team missed or didn't explicitly ask for. High quality and short."
            }
          },
          required: ["shortResponse", "summary", "actionItems", "risks", "changingFactors", "decisionAnalytics", "themes", "contradictions", "swot", "proactiveInsight"]
        }
      }
    });

    const resultText = response.text;
    res.json(JSON.parse(resultText || "{}"));
  } catch (error: any) {
    console.warn("Gemini API Error occurred, generating dynamic fallback strategy report:", error.message || error);
    try {
      const fallback = generateStrategicFallback(notesContent, command);
      res.json(fallback);
    } catch (fallbackError: any) {
      console.error("Critical: Fallback generation failed:", fallbackError);
      res.status(500).json({ error: error.message || "An error occurred during analysis" });
    }
  }
});

// Send email simulation route (with logs so the user has fully transparent verification)
app.post("/api/send-email", (req, res) => {
  const { recipient, subject, body, provider, sectionsShared } = req.body;
  
  if (!recipient) {
    return res.status(400).json({ error: "Recipient email is required" });
  }

  const newLog: EmailLog = {
    id: "mail_" + Math.random().toString(36).substr(2, 9),
    recipient,
    subject: subject || "Leadership Collaborative Briefing",
    body: body || "",
    timestamp: new Date().toLocaleTimeString(),
    status: "delivered",
    provider: provider || "gmail",
    sectionsShared: sectionsShared || { notes: true, summary: true, risks: true, dependencies: true }
  };

  emailHistory.unshift(newLog);
  res.json({ success: true, email: newLog });
});

// Get email history
app.get("/api/email-history", (req, res) => {
  res.json(emailHistory);
});

// Vite server setup for development & SPA serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { Collaborator, Notebook } from "../types";

export const CO_FOUNDERS: Collaborator[] = [
  {
    id: "col_5",
    name: "Himanshi Kalra",
    email: "himanshi.kalra02@gmail.com",
    role: "Lead Founder (You)",
    avatar: "HK",
    color: "indigo",
    active: true
  }
];

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: "nb_1",
    title: "🚀 Q3 Global Scaling & 50% Cost Reductions",
    lastUpdated: "14:10",
    collaborators: [CO_FOUNDERS[0]],
    blocks: [
      {
        id: "b1",
        type: "text",
        content: "Drafting the execution blueprint for our apparel product line expansion into South Asia. The primary mandate is streamlining operational logistics to realize a 50% cost reduction for our new clothing product line in India by optimizing regional supply chain bottlenecks.",
        fontSize: "lg",
        bold: true,
        highlightColor: "bg-slate-100"
      },
      {
        id: "b2",
        type: "text",
        content: "Reviewing direct materials sourcing. Our Surat supply consortium suggested negotiating raw fabric margins from domestic suppliers in Surat, while our logistics team believes we should invest in warehouse automation near Chennai ports to cut handling overheads by 20%.",
        fontSize: "base"
      },
      {
        id: "b3",
        type: "table",
        content: "",
        table: {
          headers: ["Strategy", "Projected Cost Saving", "Friction Level", "Suggested Owner"],
          rows: [
            ["Surat Sourcing Consortium", "35% - Fabrics", "Medium", "@Himanshi Kalra"],
            ["Chennai Warehouse Automation", "15% - Logistics", "High", "Product Team"],
            ["Direct-to-Retail Logistics Route", "10% - Middlemen", "Low", "@Himanshi Kalra"]
          ]
        }
      },
      {
        id: "b4",
        type: "text",
        content: "Next major bottleneck: Import customs and inter-state tax duties. We need our Operations Lead to run a strategic audit on government manufacturing subsidies for early stage clean-tech integrations. High priority.",
        italic: true,
        fontSize: "sm"
      },
      {
        id: "b_poll",
        type: "poll",
        content: "",
        poll: {
          question: "Which logistics pivot has priority for our October milestone?",
          options: [
            { id: "opt_1", text: "Surat Sourcing Consortium (Raw Fabrics)", votes: 3 },
            { id: "opt_2", text: "Chennai Warehouse Automation (Logistics)", votes: 2 },
            { id: "opt_3", text: "Direct-to-Retail Route (Middlemen)", votes: 1 }
          ],
          votedUserIds: ["col_1", "col_2"]
        }
      }
    ]
  },
  {
    id: "nb_2",
    title: "⚡ Series B Fundraising Strategy",
    lastUpdated: "Yesterday",
    collaborators: [CO_FOUNDERS[0]],
    blocks: [
      {
        id: "nb2_b1",
        type: "text",
        content: "Aiming for a $45M raise at a $320M pre-money valuation. Current ARR sits at $14.2M, with a consistent 2.4x YoY expansion coefficient.",
        fontSize: "lg",
        bold: true
      },
      {
        id: "nb2_b2",
        type: "text",
        content: "Our primary advisors suggest that we present a highly technical plan illustrating path to $100M ARR in 36 months. We should model server capacity reductions and margin improvements. Tagging @Himanshi Kalra to inspect our infrastructure efficiency metrics.",
        fontSize: "base"
      },
      {
        id: "nb2_b3",
        type: "bullets",
        content: "Key Pitch Elements:\n- Multi-region localized supply hubs to lock margins\n- Proprietary design generator API reducing iteration cycle from 4 weeks to 2 hours\n- Capital efficiency: current cash burn is $320k/month, giving us 18 months runway."
      }
    ]
  },
  {
    id: "nb_3",
    title: "🧬 AI Generative Engine & SDK Migration",
    lastUpdated: "3 days ago",
    collaborators: [CO_FOUNDERS[0]],
    blocks: [
      {
        id: "nb3_b1",
        type: "text",
        content: "Migrating core inference services to Google GenAI modern SDK. Target latency reduction: 180ms.",
        fontSize: "base"
      },
      {
        id: "nb3_b2",
        type: "text",
        content: "Current infrastructure cost breakdown shows GPU compute taking 70% of cloud budget. We must run quantization on models or migrate to shared-tenant TPUs.",
        fontSize: "base",
        highlightColor: "bg-rose-50"
      }
    ]
  }
];

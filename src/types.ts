export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  color: string; // Tailind bg class for cursor / highlight decoration
  active: boolean;
}

export interface TableCell {
  value: string;
}

export interface NoteTable {
  headers: string[];
  rows: string[][];
}

export interface NotePollOption {
  id: string;
  text: string;
  votes: number;
}

export interface NotePoll {
  question: string;
  options: NotePollOption[];
  votedUserIds?: string[];
}

export interface NoteBlock {
  id: string;
  type: "text" | "table" | "bullets" | "poll";
  content: string; // For text and bullets
  table?: NoteTable; // For table block
  poll?: NotePoll; // For poll block
  bold?: boolean;
  italic?: boolean;
  highlightColor?: string; // Tailwind bg class like 'bg-yellow-100', 'bg-emerald-100', etc.
  fontSize?: "sm" | "base" | "lg" | "xl";
  authorName?: string;
  authorAvatar?: string;
}

export interface Notebook {
  id: string;
  title: string;
  blocks: NoteBlock[];
  collaborators: Collaborator[];
  lastUpdated: string;
}

export interface DecisionAnalytic {
  metric: string;
  value: string;
  context: string;
}

export interface ActionItem {
  task: string;
  assignee: string;
  priority: string;
}

export interface StrategicTheme {
  theme: string;
  whatWasSaid: string;
  whatItMeans: string;
  whatCouldGoWrong: string;
  whatsMissing: string;
}

export interface StrategicContradiction {
  items: string;
  tradeoff: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface JarvisInsight {
  shortResponse: string;
  summary: string;
  actionItems: ActionItem[];
  risks: string[];
  changingFactors: string[];
  decisionAnalytics: DecisionAnalytic[];
  themes?: StrategicTheme[];
  contradictions?: StrategicContradiction[];
  swot?: SwotAnalysis;
  fallbackActive?: boolean;
  proactiveInsight?: string;
}

export interface EmailLog {
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

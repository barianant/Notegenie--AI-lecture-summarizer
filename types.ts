
export interface MindMapNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  type?: string;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface KeyConcept {
  term: string;
  definition: string;
}

export interface AnalysisResult {
  executiveSummary: string;
  hierarchy: {
    topic: string;
    subtopics: string[];
  }[];
  keyConcepts: KeyConcept[];
  mindMap: {
    nodes: { id: string; label: string; x: number; y: number }[];
    edges: { source: string; target: string }[];
  };
  language: string;
}

export interface NoteSession {
  id: string;
  timestamp: number;
  title: string;
  transcript: string;
  result: AnalysisResult | null;
}

export enum DetailLevel {
  CONCISE = 'concise',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive'
}


export interface BugReport {
  code: string;
  expectedBehavior: string;
  actualOutput: string;
  fileName?: string;
  language?: string;
}

export interface LibraryInfo {
  name: string;
  purpose: string;
  isBuiltIn: boolean;
}

export interface DetailedIssue {
  lineNumber: number;
  originalLine: string;
  errorType: 'Syntax' | 'Logic' | 'Runtime' | 'Typo' | 'Optimization';
  technicalExplanation: string;
  plainLanguageExplanation: string;
  suggestedFix: string;
  fixedOutputExample?: string;
}

export interface TerminalMessage {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export interface PostMortemResult {
  detectedLanguage: string;
  purposeSummary: string;
  libraryAnalysis: LibraryInfo[];
  codeOverview: {
    overall: string;
    keyLogicPoints: string[];
  };
  assumptionError: {
    title: string;
    description: string;
  };
  lineByLineAudit: DetailedIssue[];
  enhancementSuggestions: string[];
  fullEnhancedCode: string;
  terminalSimulation: {
    sampleInput: string;
    expectedOutput: string;
    status: 'success' | 'failure';
    actualCommand?: string;
    fullRawOutput?: string;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  report: BugReport;
  result: PostMortemResult;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

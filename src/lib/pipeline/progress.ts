export interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface PipelineProgress {
  runId: string;
  mode: "full" | "collect";
  status: "idle" | "running" | "done" | "error";
  steps: PipelineStep[];
  currentStep: number;
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

type Listener = (progress: PipelineProgress) => void;

const FULL_STEPS = [
  { id: "collect_rss", label: "Collecting RSS feeds" },
  { id: "collect_hn", label: "Fetching Hacker News" },
  { id: "collect_reddit", label: "Fetching Reddit" },
  { id: "dedup", label: "Deduplicating articles" },
  { id: "filter", label: "Filtering recent (24h)" },
  { id: "ai", label: "AI processing (summarize, rank, insights)" },
  { id: "breaking", label: "Checking breaking news alerts" },
  { id: "save", label: "Saving to database" },
  { id: "github", label: "Fetching GitHub Trending" },
  { id: "compose", label: "Composing newsletter" },
  { id: "email", label: "Sending emails" },
  { id: "telegram", label: "Sending Telegram" },
];

const COLLECT_STEPS = [
  { id: "collect_rss", label: "Collecting RSS feeds" },
  { id: "collect_hn", label: "Fetching Hacker News" },
  { id: "dedup", label: "Deduplicating articles" },
  { id: "save", label: "Saving to database" },
];

// Global state for the current pipeline run
let currentProgress: PipelineProgress | null = null;
const listeners = new Set<Listener>();

export function getProgress(): PipelineProgress | null {
  return currentProgress;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (currentProgress) listener(currentProgress);
  return () => listeners.delete(listener);
}

function emit() {
  if (!currentProgress) return;
  for (const listener of listeners) {
    try {
      listener(currentProgress);
    } catch {
      // ignore failed listeners
    }
  }
}

export function startPipeline(mode: "full" | "collect"): string {
  const runId = `run_${Date.now()}`;
  const stepDefs = mode === "full" ? FULL_STEPS : COLLECT_STEPS;

  currentProgress = {
    runId,
    mode,
    status: "running",
    steps: stepDefs.map((s) => ({ ...s, status: "pending" as const })),
    currentStep: -1,
    startedAt: Date.now(),
  };

  emit();
  return runId;
}

export function stepStart(stepId: string, detail?: string) {
  if (!currentProgress) return;
  const idx = currentProgress.steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return;

  currentProgress.steps[idx].status = "running";
  currentProgress.steps[idx].startedAt = Date.now();
  if (detail) currentProgress.steps[idx].detail = detail;
  currentProgress.currentStep = idx;

  emit();
}

export function stepDone(stepId: string, detail?: string) {
  if (!currentProgress) return;
  const idx = currentProgress.steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return;

  currentProgress.steps[idx].status = "done";
  currentProgress.steps[idx].finishedAt = Date.now();
  if (detail) currentProgress.steps[idx].detail = detail;

  emit();
}

export function stepError(stepId: string, detail?: string) {
  if (!currentProgress) return;
  const idx = currentProgress.steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return;

  currentProgress.steps[idx].status = "error";
  currentProgress.steps[idx].finishedAt = Date.now();
  if (detail) currentProgress.steps[idx].detail = detail;

  emit();
}

export function finishPipeline(error?: string) {
  if (!currentProgress) return;
  currentProgress.status = error ? "error" : "done";
  currentProgress.finishedAt = Date.now();
  if (error) currentProgress.error = error;

  emit();
}

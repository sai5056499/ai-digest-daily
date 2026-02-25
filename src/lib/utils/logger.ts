type LogLevel = "info" | "warn" | "error" | "debug";

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = formatTimestamp();
  const prefix = {
    info: "ℹ️ ",
    warn: "⚠️ ",
    error: "❌",
    debug: "🔍",
  }[level];

  const logMessage = `[${timestamp}] ${prefix} ${message}`;

  switch (level) {
    case "error":
      console.error(logMessage, data || "");
      break;
    case "warn":
      console.warn(logMessage, data || "");
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.log(logMessage, data || "");
      }
      break;
    default:
      console.log(logMessage, data || "");
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
  debug: (message: string, data?: unknown) => log("debug", message, data),
};

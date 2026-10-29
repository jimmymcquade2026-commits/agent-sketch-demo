import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-6-luna-fast",
  reasoning: "high",
  defaultTools: false,
  limits: { sessionTimeoutMs: 60000, sessionUsage: ({total}) => total.outputTokens >= 6000 || (total.costUsd ?? 0) >= 0.2 },
});

// Makes authenticated API calls to confirm the credentials in the environment
// work (API key, or Workload Identity Federation) and can reach Managed Agents.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const page = await client.models.list({ limit: 1 });
console.log(`Authenticated. First model listed: ${page.data[0]?.id ?? "(none)"}`);

const agents = await client.beta.agents.list({ limit: 20 });
console.log(`Managed Agents reachable. Agents in this workspace: ${agents.data.map((a) => a.name).join(", ") || "(none yet)"}`);

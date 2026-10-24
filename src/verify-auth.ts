// Makes one authenticated API call, to confirm the credentials in the
// environment work (API key, or Workload Identity Federation).

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const page = await client.models.list({ limit: 1 });
console.log(`Authenticated. First model listed: ${page.data[0]?.id ?? "(none)"}`);

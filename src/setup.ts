// One-time (and re-runnable) setup: creates the reviewer's environment and
// agent, or updates them in place when they already exist. Each agent update
// publishes a new version; review sessions always use the latest one.
//
//   ANTHROPIC_API_KEY=sk-ant-... node src/setup.ts

import Anthropic from "@anthropic-ai/sdk";
import { agentConfig, environmentConfig } from "./agent.ts";
import { findAgent, findEnvironment } from "./lookup.ts";

const client = new Anthropic();

const existingEnv = await findEnvironment(client, environmentConfig.name);
const env = existingEnv
  ? await client.beta.environments.update(existingEnv.id, environmentConfig)
  : await client.beta.environments.create(environmentConfig);
console.log(`${existingEnv ? "Updated" : "Created"} environment ${env.name}: ${env.id}`);

const existingAgent = await findAgent(client, agentConfig.name);
const agent = existingAgent
  ? await client.beta.agents.update(existingAgent.id, agentConfig)
  : await client.beta.agents.create(agentConfig);
console.log(`${existingAgent ? "Updated" : "Created"} agent ${agent.name}: ${agent.id} (version ${agent.version})`);

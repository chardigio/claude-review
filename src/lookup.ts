import type Anthropic from "@anthropic-ai/sdk";

export async function findAgent(client: Anthropic, name: string) {
  for await (const agent of client.beta.agents.list()) {
    if (agent.name === name) return agent;
  }
  return undefined;
}

export async function findEnvironment(client: Anthropic, name: string) {
  for await (const env of client.beta.environments.list()) {
    if (env.name === name) return env;
  }
  return undefined;
}

export async function findVault(client: Anthropic, name: string) {
  for await (const vault of client.beta.vaults.list()) {
    if (vault.display_name === name) return vault;
  }
  return undefined;
}

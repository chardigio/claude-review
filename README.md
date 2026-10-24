# claude-review

A pull request reviewer built on [Claude Managed Agents](https://docs.claude.com/en/docs/agents/managed-agents),
packaged as a GitHub Action. It bills to an Anthropic API key, so it runs on Console API credits.

## How it works

```
PR opened ──▶ GitHub Action (this repo) ──▶ Managed Agents session ──▶ review.json ──▶ PR review
              fetches diff, starts session   clones repo, reads code,     downloaded     posted with
                                             runs tests, writes findings  by the Action  GITHUB_TOKEN
```

Managed Agents has no inbound triggers, so a small relay has to start each session. A GitHub Action
is that relay: no server to host, and it gets a GitHub token for free.

1. The workflow fires on `pull_request_target` and runs `src/review.ts`.
2. The script fetches the PR diff, uploads it, and creates a session on the `pr-reviewer` agent with
   the repo mounted as a `github_repository` resource (at the PR head, or at the merge base plus the
   diff for fork PRs). Each session has a hard spend cap (`budget-usd`, default $5).
3. In its sandbox, the agent applies the diff on top of the merge base, installs Claude Code, and
   runs the bundled `/code-review` at medium effort. It converts the findings into
   `/mnt/session/outputs/review.json`, one inline comment per finding tied to a changed line.
4. The script downloads that file and posts one `COMMENT` review with inline comments. It never
   approves or requests changes.

The agent definition (model, system prompt, tools) lives in [`src/agent.ts`](src/agent.ts).
Change it and push to `main`; the **Set up reviewer agent** workflow publishes a new agent version
and every later review uses it.

## Setup

Auth uses [Workload Identity Federation](https://platform.claude.com/docs/en/manage-claude/wif-providers/github-actions):
each job signs in to Anthropic with its own GitHub identity token, so no repo holds an API key.
The federation rule, organization, service account, and workspace IDs are defaults in
[`action.yml`](action.yml). They are not secret.

1. **Give Claude Code an API key.** Claude Code runs inside the sandbox and needs its own key. In
   the Console, create a vault named `pr-reviewer` with one environment-variable credential:
   secret name `ANTHROPIC_API_KEY`, the key as its value, and allowed host `api.anthropic.com`.
   The key never enters the sandbox; Anthropic swaps it in on requests to that host.
2. **Create the agent.** Actions tab → **Set up reviewer agent** → Run workflow.
3. **Turn it on in a repo.** Copy [`examples/claude-review.yml`](examples/claude-review.yml) to
   `.github/workflows/claude-review.yml` there. It takes effect once it's on the default branch.
   The repo must match a federation rule in the Console
   ([Workload identity](https://platform.claude.com/settings/workload-identity-federation)).
   A repo outside those rules can pass its own `anthropic-federation-rule-id`, or an
   `anthropic-api-key` from a secret instead.

**Verify Anthropic auth** makes one API call with the federation rule, to check it works.

## When it runs

- Automatically on opened, reopened, and ready-for-review PRs whose author is the owner, an org
  member, or a collaborator. Drafts are skipped.
- On any PR when someone adds the `claude-review` label. Remove and re-add it for a fresh review.

## Options

```yaml
- uses: sddamico/claude-review@main
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    budget-usd: "10"                       # per-session cap, default 5
    extra-instructions: "We target iOS 17+; flag any API that needs a newer OS."
    anthropic-workspace-id: wrkspc_...      # only for the live session link in the log
```

## Security notes

- The PR's code is never checked out or run on the Actions runner, which is what makes
  `pull_request_target` safe here. It only runs inside Anthropic's sandbox.
- The sandbox has no secrets. The GitHub token is injected by Anthropic's git proxy, and the
  environment's network is limited to package registries.
- PR text is treated as data, but a malicious PR could still steer what the review says. Reviews are
  `COMMENT` only, so the worst case is a misleading comment.

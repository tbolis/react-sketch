---
name: git-workflow
description: Git workflow conventions for branching, commits, and pull requests. Use when creating branches, writing commit messages, creating or editing PRs, or any git operations in this repo.
---

# Git Workflow Conventions

## Branch Naming

Format: `feat/<ticket-lowercase>/<short-description>`

- Ticket number is lowercased with hyphen kept (e.g., CHB-8404 becomes `chb-8404`)
- Description is kebab-case
- Examples:
  - `feat/chb-8404/remove-dev-hold-step`
  - `feat/chb-7515/add-pep-permissioning`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/). Include the ticket number in the scope.

Format: `type(TICKET): description`

- Ticket number stays uppercase in commits (e.g., `CHB-8404`)
- Types: `feat`, `fix`, `ci`, `build`, `refactor`, `test`, `docs`, `chore`

Examples:

```
ci(CHB-8404): remove hold step in CI/CD for dev
feat(CHB-7515): add PEP for permissioning
fix(CHB-8354): conditional writes for transaction writer
build(CHB-8410): address vulnerabilities
```

## Pull Requests

**Title**: Same format as commit messages -- `type(TICKET): description`

**Body**: Follow the PR template at [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md).

For assignee use `--assignee <github-username>` (individual logins only).

## Git Preferences

- **Never force-push.** If a commit needs correcting after push, create a new commit instead of amending + force-pushing.
- Never amend commits that have already been pushed to the remote.

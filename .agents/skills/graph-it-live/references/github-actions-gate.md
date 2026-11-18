# Graph-It Review Gate for GitHub Actions

Read on demand from `graph-it-live` when creating or modernizing a `graph-it-review-gate` CI workflow.

Resolve the latest stable official GitHub release of `magic5644/Graph-It-Live` first, dereference that release tag to its full commit SHA, and pin the Action to that SHA with the release tag in a comment. Never use a floating ref or copy the dated snapshot (`v1.17.0`) below without verifying the current release:

```yaml
name: Graph-It Review Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: magic5644/Graph-It-Live/.github/actions/graph-it-review-gate@2f9d5cd9756c8add33e7a2b30e34be7c131048ac # v1.17.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          comment: ${{ github.event.pull_request.head.repo.fork && 'false' || 'true' }}
          fail-on-risk: high
          max-depth: "3"
          max-files: "200"
          cli-version: "" # empty installs npm CLI @latest
```

## Action Inputs & Outputs

- **Inputs**: `token` (required when `comment: true`), `base-ref` (defaults to PR base SHA), `comment` (disable for fork PRs), `fail-on-risk` (`high` or `critical`), `cli-version`, `max-depth`, `max-files`.
- **Outputs**: `risk`, `score`, `cli-version`, `architecture-new-errors` (any new unaccepted `error` violation of `graphit.architecture.json` fails the gate).

## Security & Maintenance

- Use least privilege: remove `pull-requests: write` and set `comment: false` if PR comments are not needed. Never expose write tokens to untrusted fork code.
- Merge a `github-actions` weekly entry into `.github/dependabot.yml` to keep the pinned Action SHA up to date:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

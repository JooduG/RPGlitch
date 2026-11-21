# Graph-It Review Gate for GitHub Actions

Read on demand from `graph-it-live` when maintaining, debugging, or extending RPGlitch's GitHub Actions `graph-review` job (`.github/workflows/ci.yml`) or setting up `graph-it-review-gate` in another repo.

## 1. Current RPGlitch Setup (`.github/workflows/ci.yml`)

RPGlitch runs two separate jobs in `ci.yml`:

- **`physics-gate`**: Runs on `push` (`main`, `develop`), `pull_request`, and `workflow_dispatch`. Executes `npm ci`, `npm run sync`, `npm run verify` (which includes `audit:layers` and `audit:dead-code`), `npm run build`, bundle-size check (`<= 4.00 MB`), and `git diff --exit-code`. Requires `@magic5644/graph-it-live` in `package.json` `devDependencies` so `graph-it` is available to `npm run verify` on clean runners.
- **`graph-review`**: Runs on `pull_request` only. Checks out full Git history (`fetch-depth: 0`) so `review-pr` can diff against the merge base, runs `magic5644/Graph-It-Live/.github/actions/graph-it-review-gate`, evaluates `graphit.architecture.json` rules, posts a PR comment on non-fork PRs, and fails when risk reaches `high` or any new unaccepted architecture `error` appears.

```yaml
graph-review:
  name: "🕸️ Graph-It Review Gate"
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    pull-requests: write
  steps:
    - uses: actions/checkout@<PINNED_COMMIT_SHA> # v7.0.1
      with:
        fetch-depth: 0
    - uses: magic5644/Graph-It-Live/.github/actions/graph-it-review-gate@<PINNED_COMMIT_SHA> # v1.25.x
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        comment: ${{ github.event.pull_request.head.repo.fork && 'false' || 'true' }}
        fail-on-risk: high
        max-depth: "3"
        max-files: "200"
        cli-version: "" # empty installs npm @latest; pin a semver string for strict reproducibility
```

## 2. Action Inputs & Outputs

| Direction | Name                      | Purpose & Default                                                                                        |
| --------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Input     | `token`                   | GitHub token (`${{ secrets.GITHUB_TOKEN }}`), required when `comment: true`.                             |
| Input     | `base-ref`                | Git ref to diff against (defaults to PR base SHA).                                                       |
| Input     | `comment`                 | Post or update PR summary comment. Always disable for fork PRs.                                          |
| Input     | `fail-on-risk`            | Risk threshold that fails the job (`high` or `critical`; omitted = informational only).                  |
| Input     | `max-depth`               | Transitive dependent traversal depth (string, e.g. `"3"`).                                               |
| Input     | `max-files`               | Cap on changed files analyzed (string, default `"200"`).                                                 |
| Input     | `cli-version`             | Specific `@magic5644/graph-it-live` npm version, or `""` for `@latest`.                                  |
| Output    | `risk`                    | Computed risk tier (`low`, `medium`, `high`, `critical`).                                                |
| Output    | `score`                   | Numeric risk score of the highest-risk changed symbol.                                                   |
| Output    | `cli-version`             | Resolved CLI version used by the run.                                                                    |
| Output    | `architecture-new-errors` | Count of new unaccepted error violations against `graphit.architecture.json` (any `> 0` fails the gate). |

## 3. Security & Maintenance Rules

- **SHA Pinning**: Always pin third-party Actions to a full 40-character commit SHA with the release tag in a trailing comment (never use floating `@v1` or `@main` tags). Before bumping manually, resolve the latest stable GitHub release of `magic5644/Graph-It-Live` and dereference its tag to the commit SHA.
- **Dependabot Automation**: `.github/dependabot.yml` already tracks `package-ecosystem: github-actions` weekly, opening automated PRs whenever a newer Action release ships so pinned SHAs stay fresh without manual polling.
- **Least Privilege & Fork Safety**: Keep top-level `permissions: contents: read` on `ci.yml` and grant `pull-requests: write` only on the `graph-review` job. Never switch the trigger to `pull_request_target` on untrusted PRs. If you disable PR comments altogether, remove `pull-requests: write` and set `comment: false`.

## 4. Optional Next Upgrade: GitHub Code Scanning (SARIF)

To surface architecture rule violations inline on PR diffs under the GitHub `Security -> Code scanning` tab, add a step to a job with `security-events: write`:

```yaml
- name: "Export Architecture Violations (SARIF)"
  if: always()
  run: npx graph-it check-architecture --format sarif > architecture.sarif || true
- uses: github/codeql-action/upload-sarif@<PINNED_COMMIT_SHA>
  if: always()
  with:
    sarif_file: architecture.sarif
```

# Team Guide — avoiding merge conflicts

## Stay in your folder

| Person | Folder(s) | Branch |
|---|---|---|
| Neerav | `server/` | `feature/neerav-chaining-server` |
| Shelly | `ml/` | `feature/shelly-ml` |
| Kaavya | `mirror/`, `dashboard/` | `feature/kaavya-frontend` |
| Pulkit | `mirror/`, `dashboard/` | `feature/pulkit-frontend` |

Kaavya and Pulkit share `mirror/` + `dashboard/` — see "Splitting shared folders" below,
that's the one pairing likely to actually collide.

## The two contracts — do not change without telling everyone

These are the only interfaces that cross folder boundaries. If you need to change
either shape, say so in the team chat *before* pushing, since it breaks someone
else's code silently otherwise.

1. **Landmark → sign** (`ml/` → `mirror/`): fixed-shape landmark array in, `{ sign, confidence }` out.
2. **Alert event** (`server/` ↔ `mirror/`, `dashboard/`): `{ sign, timestamp, confidence }` over the `alert` socket event.

Both are documented in `CLAUDE.md`.

## Splitting shared folders (Kaavya + Pulkit)

Pick a sub-boundary before starting so you're not editing the same file:
- e.g. Kaavya owns `mirror/` (camera UI, confidence ring, need cards), Pulkit owns `dashboard/` (alert pop-ups, Reassurance Drawer) — or split by component file, not by line, inside one folder.
- Never both edit `App.jsx` in the same folder in the same day without syncing first.

## Workflow

1. Branch off latest `main`, don't branch off someone else's feature branch:
   ```
   git checkout main && git pull && git checkout -b feature/<you>-<thing>
   ```
2. Commit small and often — a 400-line diff is unreviewable and conflict-prone.
3. Before opening a PR, rebase on latest `main` (not merge):
   ```
   git fetch origin && git rebase origin/main
   ```
4. PR into `main`, one reviewer glance minimum even at hackathon speed — catches contract breaks early.
5. Delete your branch after merge.

## Lockfiles

Each folder (`mirror/`, `dashboard/`, `server/`) has its own `package-lock.json`.
Only run `npm install` inside the folder you're actually touching — don't run it
from the repo root, and don't hand-edit a lockfile. If two people add deps to the
same folder in parallel, the lockfile is the one file where "just take mine" is
fine to resolve conflicts with (`npm install` regenerates it cleanly either way).

## If you do hit a conflict

Whoever touches the shared contract file last resolves it — don't let git's
auto-merge silently pick one side of a landmark-shape or alert-shape change.
Re-read `CLAUDE.md`'s contract section before resolving.

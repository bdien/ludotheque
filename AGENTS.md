# AGENTS.md

## Projet

Ludothèque du Poisson-Lune d'Acigné — gestion de jeux, emprunts, adhérents.
Prod : https://ludotheque.fly.dev/ — Déployé via `Dockerfile` sur Fly.io.

## Stack

- **API** : Python 3.14+, FastAPI, Peewee (SQLite), APScheduler, Jinja2. `src/api/`
- **WebUI** : React 19, MUI 7, Vite 8, TypeScript strict, PWA (workbox). `src/webui/`
- **DB** : SQLite (non versionnée)
- **Package managers** : `uv` (Python), `pnpm` (TS)

## Règles

La WebUI est principalement destinée à être utilisée sur un téléphone portable. Le
design doit toujours être fait pour un téléphone en premier, puis être utilisable
sur un ordinateur ensuite.

Le Backend python tournera sur un docker linux limité en mémoire (256Mo).
Le code python doit toujours passer les règles du linter (`ruff`). Ne pas introduire
de nouvelles erreurs de types (`ty`), amélioration progressive.

La base de données sqlite3 est accessible en lecture seule dans `storage/ludotheque.db`.

Ne pas toucher `storage/`, `src/webui/dist/`, `node_modules/`, `.venv/`.

## Structure

```bash
src/api/        # FastAPI — main.py, models.py/pwmodels.py, items/loans/users/ledger/system/...
src/api/tests/  # pytest — conftest.py monte une DB SQLite temporaire
src/webui/src/  # React — api/, components/, pages/, hooks/, App.tsx, theme.tsx
src/webui/dist/ # build Vite (généré)
storage/        # DB + img/thumb (gitignored)
setup/          # start.sh, nginx.conf (prod)
```

## Commandes

```bash
uv run pytest -q --no-summary                    # tests API
uv run pytest -q --no-summary--cov               # avec coverage
uv run ruff check .  -q --output-format concise  # Python linter (--fix is available)
uv run ty check .  -q --output-format concise    # Python types check
uv run task api                                  # API dev (uvicorn --reload, port 8000)
uv run task webui                                # WebUI dev (vite, proxy /api -> :8000)
uv run task build                                # build webui (tsc + vite build)
uv run task weblint                              # lint webui (biome check --fix)
pnpm install --dir src/webui                     # install deps webui
```

## Règles pour les agents

# site

[https://ludotheque.fly.dev/](https://ludotheque.fly.dev/)

# Developpement

## Prerequisites

- Python: [uv](https://docs.astral.sh/uv/getting-started/installation/)
- TypeScript: [pnpm](https://pnpm.io/fr/)
- Node 16+

## Serveur

Le serveur est en Python 3.13+ avec FastAPI, peewee.

Pour lancer les tests: `uv run pytest`
Pour lancer le serveur: `uv run task api`

## WebUI

La webUI est en React 18+, MaterialUI 5+.

Pour installer les dependances: `pnpm install`
Pour lancer le serveur: `uv run task webui`

## Fichiers hors projets

Des fichiers supplémentaires sont nécessaires, notamment les images des jeux.

La base de données sera créée au premier lancement.

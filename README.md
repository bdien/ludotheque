# Demo

[https://ludotheque.fly.dev/](https://ludotheque.fly.dev/)

# Developpement

## Prerequisites

- Python: [pdm](https://pdm.fming.dev/latest/)
- TypeScript: [pnpm](https://pnpm.io/fr/)
- Node 16+

## Serveur

Le serveur est en Python 3.11+ avec FastAPI, peewee.

Pour installer les dependances: `pdm install`
Pour lancer le serveur: `pdm run api`

## WebUI

La webUI est en React 18+, MaterialUI 5+.

Pour installer les dependances: `pnpm install`
Pour lancer le serveur: `pdm run webui`

## Fichiers hors projets

Des fichiers supplémentaires sont nécessaires, notamment les images des jeux.

La base de données sera créée au premier lancement.

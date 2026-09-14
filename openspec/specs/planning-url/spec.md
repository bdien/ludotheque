# planning-url Specification

## Purpose
Permet aux admins de configurer l'URL du planning bénévoles sans déployer et offre un raccourci stable `/planning` qui redirige vers cette URL, avec gestion du cas vide.

## Requirements

### Requirement: Config planning_url éditable par admin
Le système SHALL exposer une clé `planning_url` de type string, éditable via `POST /config` (droit `system`), avec valeur par défaut `https://framadate.org/iq7g6GZcr3rECGcC`, et la persister en base via la table `Config`.

#### Scenario: Valeur par défaut sans ligne DB
- **WHEN** aucune ligne `planning_url` n'existe en DB et `GET /config` ou `GET /info` est appelé
- **THEN** le système retourne `planning_url = "https://framadate.org/iq7g6GZcr3rECGcC"`

#### Scenario: Admin modifie l'URL
- **WHEN** un admin authentifié avec droit `system` fait `POST /config {"planning_url": "https://exemple.org/planning"}`
- **THEN** la valeur est persistée et les appels suivants à `GET /config` et `GET /info` retournent la nouvelle URL

#### Scenario: Non-admin ne peut pas modifier
- **WHEN** un utilisateur sans droit `system` fait `POST /config {"planning_url": "..."}`
- **THEN** le système retourne 403

#### Scenario: Page Config affiche et sauvegarde
- **WHEN** un admin ouvre `/config`
- **THEN** le champ "URL du planning bénévoles" est pré-rempli avec `planning_url` courant, et "Sauvegarder" persiste via `POST /config` puis invalide `/info`

### Requirement: Exposition publique via /info
Le système SHALL inclure `planning_url` dans la réponse de `GET /info` (public, sans auth), reflétant `__DEFAULTS | DB`.

#### Scenario: Info publique expose planning_url
- **WHEN** `GET /info` est appelé sans authentification
- **THEN** la réponse JSON contient `planning_url` de type string

### Requirement: Page d'accueil utilise le lien configurable
Le système SHALL afficher sur `/` (composant `Main`) le paragraphe bénévoles avec lien vers `/planning` seulement si l'utilisateur est authentifié ET `planning_url` est non vide ; sinon le paragraphe est masqué.

#### Scenario: Authentifié avec URL configurée
- **WHEN** un utilisateur authentifié visite `/` et `planning_url = "https://framadate.org/abc"`
- **THEN** le paragraphe "Si vous souhaitez aider aux permanences..." est visible et le lien pointe vers `/planning` (href="/planning")

#### Scenario: Non authentifié
- **WHEN** un utilisateur non authentifié visite `/`
- **THEN** le paragraphe bénévoles n'est pas affiché quel que soit `planning_url`

#### Scenario: Authentifié mais URL vide
- **WHEN** un utilisateur authentifié visite `/` et `planning_url = ""`
- **THEN** le paragraphe bénévoles n'est pas affiché

### Requirement: Route /planning redirige vers planning_url
Le système SHALL fournir une route frontend `GET /planning` (public, SPA) qui redirige immédiatement vers `planning_url` via `window.location.replace` si l'URL est non vide ; sinon elle rend une page 404 (`NotFound`).

#### Scenario: Redirection quand URL configurée
- **WHEN** un utilisateur (authentifié ou non) navigue vers `/planning` et `planning_url = "https://framadate.org/abc"`
- **THEN** le navigateur est redirigé vers `https://framadate.org/abc` (replace, pas d'entrée historique supplémentaire)

#### Scenario: 404 quand URL vide
- **WHEN** un utilisateur navigue vers `/planning` et `planning_url = ""` ou `null`
- **THEN** le système affiche la page 404 avec bouton "Accueil"

#### Scenario: Attente chargement info
- **WHEN** `/planning` est ouvert et `GET /info` est encore en chargement
- **THEN** un indicateur de chargement est affiché avant la redirection ou le 404

### Requirement: Persistance et invalidation cache
Le système SHALL invalider le cache `SWR` de `/info` après une sauvegarde réussie dans `/config` afin que `/` et `/planning` reflètent immédiatement la nouvelle URL.

#### Scenario: Sauvegarde invalide le cache
- **WHEN** un admin sauvegarde `planning_url` dans `/config`
- **THEN** `mutate("/info")` est appelé et les pages `/` et `/planning` utilisent la nouvelle valeur sans rechargement manuel

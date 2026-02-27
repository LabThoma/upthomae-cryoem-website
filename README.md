# 🔬 CryoEM Grid Manager

> A web-based sample tracking and grid management platform for cryo-electron microscopy workflows.
## What is this?

The **CryoEM Grid Manager** tracks every grid from the moment it's plunge-frozen, through storage, screening at the microscope, all the way to data collection — giving the whole group a searchable, shared record of what was done, when, and by whom.

Built for (and by) the [THOMAE group](https://www.epfl.ch/labs/upthomae/) and [PTPSP](https://www.epfl.ch/research/facilities/ptpsp/) at EPFL, it's designed to be lightweight, self-hostable on any LAMP server, and usable from a tablet at the bench or laptop at the microscope.

---

## How It Works

The app is organized into five tabs, each covering a step in the cryo-EM workflow and tracking the grids throughout.

### 📝 Input Form — Record plunging sessions at the Vitrobot

This is the primary data-entry view, designed to be used **while you're plunging grids**. The form walks you through five sections:

1. **Session info**

- Select your name to **auto-load your settings from the last session**
- Date is auto-filled to today's date
- Grid box name is **auto-incremented** if you use the default naming scheme of initials plus 3 digits (i.e. AB012)
- Loading order of the grid box to avoid confusion
- Storage information within your puck

2. **Sample info**

- Sample name (mandatory)
- Plus concentration, volume, buffer, and additives

3. **Grid details**

- Pick a grid type from the shared inventory to keep track of the lab's usage
- Or enter a custom grid if needed
- Glow discharge settings auto-populate based on the type

4. **Vitrobot settings**

- Humidity, temperature, blot force, blot time, wait time is auto-filled from your last session to avoid constant re-entry

5. **Grid slot table**

- A per-slot table for the grid box. Check "Include" for each slot you froze
- Optionally, override session-level defaults (volume, blot time, blot force, additives) on a per-grid basis

When you're done, hit **Save & Update**. If you're freezing another box, hit **Next Box** — the box name auto-increments and your settings carry over.
### 📦 Grid Database — Browse and manage your grids

Every grid box appears in your personal database. Click your name to see all your boxes, then **expand any box** to reveal the individual grid slots inside.

From here you can:

- **View & edit** any grid's details in a popup
- **Ship** individual grids or entire boxes (marks them as sent to a facility)
- **Trash** grids you discarded. This is a soft delete only so that you can still see the grid's details in your database
- **View microscope details** of that grid if it has been screened before
- **Filter** by trashed or active grids
- See at a glance which grids were at the microscope, shipped, or trashed through visual status indicators

### 🔬 Microscope Sessions — Track screening and data collection

All the sessions are sorted by user and shows :

- An **Overview** of all the past sessions
- Expanding a sessions shows all loaded grids, their most important information and a **Quality rating** on a ⭐ 1–5 star scale
- A **Popup for details** of each grid shows comments and collection parameters — pixel size, magnification, total exposure, defocus range, slit width, number of images
- A built-in **Screening images gallery** shows low-mag and high-mag micrographs side by side, with navigation arrows and lightbox viewing
- The **Rescued status** indicates whether a grid was rescued for re-use
### 📰 Blog — Share knowledge with the group

An internal blog for cryoEM tips, freezing protocols, troubleshooting notes, or lab news. Posts support rich text and images via the TinyMCE editor, and can be searched, filtered by category or author.
### 🔧 Admin Panel — Manage inventory and sessions

A password-protected area for lab managers:

- **Grid stock inventory** — Add new grid types (manufacturer, support, spacing, mesh, extra layer, quantity). & see at a glance how many are still unused vs. how many were used in the last 3 months to estimate when reordering is needed
- **Microscope session management** — Create and edit microscope sessions, link grids, and track overnight runs.
## Things That Save You Time

The app is full of small conveniences designed to improve efficiency and consistency:

| Feature                          | What it does                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Auto-fill Vitrobot settings**  | Your last session's humidity, temperature, blot force, and blot time are pre-filled automatically.  |
| **Auto-increment box names**     | The next grid box name is calculated for you (e.g. `AB014` → `AB015`).                              |
| **Auto-populate glow discharge** | Selecting a known grid type fills in default glow discharge current and time.                       |
| **Cascading dropdowns**          | Grid batch options update based on the selected grid type.                                          |
| **Custom entry fallback**        | Every dropdown includes "+ Enter Custom" so you're never blocked by missing options.                |
| **Screening Image Gallery**      | Display screening images directly linked to each grid to make comparisons easier.                   |
| **Track grid usage**             | Track each typer separately and never run out of your favorite grids                                |
| **Real-time validation**         | Fields are validated as you type — with range checks, length limits, and required-field indicators. |
| **Expandable rows**              | Grid boxes and microscope sessions expand in place — no page navigation needed.                     |
| **Visual status indicators**     | Trashed, shipped, and microscope-visited grids are color/style-coded at a glance.                   |
| **Star ratings**                 | Quick 1–5 star input for quality assessment; read-only display in tables.                           |
| **Search & filter**              | Full-text search and category/author filters on the blog; trashed/active toggle on the database.    |

<!-- TODO: Add feature screenshots
### Screenshots

| Grid Prep Form | Grid Database | Microscope Session |
|:-:|:-:|:-:|
| ![Form](docs/screenshots/form.png) | ![Database](docs/screenshots/database.png) | ![Microscope](docs/screenshots/microscope.png) |

| Screening Gallery | Blog | Admin Panel |
|:-:|:-:|:-:|
| ![Gallery](docs/screenshots/gallery.png) | ![Blog](docs/screenshots/blog.png) | ![Admin](docs/screenshots/admin.png) |
-->

---

## Technical Reference

Everything below is for **developers and system administrators** setting up or extending the application.

- [Tech Stack & Architecture](#tech-stack--architecture)
- [Setup & Deployment](#setup--deployment)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Tools & Scripts](#tools--scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack & Architecture

**Backend:** PHP (no framework), RESTful JSON API, MariaDB/MySQL  
**Frontend:** Vanilla JavaScript (ES modules), HTML, CSS — no build step, no bundler  
**Auth:** Microsoft Entra ID via OpenID Connect  
**Other:** TinyMCE (blog editor), Font Awesome 7 (icons), Composer for PHP packages

The app is a **single-page application** served from a single PHP entry point (`index.php`). The frontend loads HTML templates via `fetch()` and talks to a PHP API router that dispatches to per-resource endpoint files. Validation is dual-layer — identical schemas enforced in [validation.js](htdocs/validation.js) (client) and [validation.php](htdocs/php/validation.php) (server).

### Requirements

- A web server with **PHP** ≥ 8.0 (Apache or Nginx)
- **MariaDB** ≥ 10.5 or **MySQL** ≥ 8.0
- **Composer** (for PHP dependencies)

---

## Setup & Deployment

### 1. Clone the repository

```sh
git clone https://github.com/ASKrebs/upthomae-cryoem-website.git
cd upthomae-cryoem-website
```

### 2. Install PHP dependencies

```sh
cd htdocs
composer install
cd ..
```

### 3. Set up the database

Create a database and import the schema:

```sh
mysql -u root -p -e "CREATE DATABASE cryoem;"
mysql -u root -p cryoem < setup.sql
```

### 4. Configure the application

```sh
cp private/config.example.php private/config.production.php
```

Edit `private/config.production.php` and fill in your database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'cryoem');
define('DB_CHARSET', 'utf8mb4');
define('SCREENING_IMAGES_UPLOAD_KEY', 'your_secret_key');
```

For the blog editor, also copy and edit the TinyMCE config:

```sh
cp private/tinymce-config.example.php private/tinymce-config.php
```

### 5. Set up authentication

Create the Entra ID environment file:

```sh
# htdocs/entra/.env.production
AUTH_URL=https://login.microsoftonline.com/{tenant-id}/v2.0
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=https://your-site.com/entra/entra.php
```

### 6. Deploy to your web server

1. Upload all files to your server. The **document root** should point to `htdocs/`.
2. Ensure `private/` and `include/` are accessible to PHP but **not** publicly served.
3. On Apache, enable `mod_rewrite` and allow `.htaccess` rewrites.

The app auto-detects the environment from `HTTP_HOST`: if it contains `epfl.ch` it loads `config.production.php`, otherwise `config.local.php`. Both include `private/config.shared.php` (Database class, error handlers, helpers).

> **EPFL users:** See [EPFL_INFO.md](EPFL_INFO.md) for university-specific setup (LAMP server request, phpMyAdmin access, Entra ID registration).

---

## Local Development

For local development, create a separate config:

```sh
cp private/config.example.php private/config.local.php
# Edit with your local database credentials

# Optionally create a local auth env file
# htdocs/entra/.env.local
```

Start the built-in PHP dev server:

```sh
cd htdocs
php -S localhost:8000 router.php
```

The router dispatches `/api/*` to `php/api.php`, serves static files directly, and falls back to `index.php` for everything else.

Apply database migrations with `mysql -u root -p cryoem < database/migrations/<file>.sql`. Back up with `./database/backup_db.sh`.

---

## Project Structure

```
htdocs/                 # Web root (document root for your server)
├── index.php           # SPA entry point
├── router.php          # Dev server router (php -S)
├── components/         # HTML template fragments
├── entra/              # Entra ID / OIDC authentication
├── php/api.php         # API router → php/endpoints/*.php
├── scripts/            # Frontend JS (views/, controllers/, components/, utils/)
└── styles/             # Modular CSS (base/, components/, features/, layout/)

include/config.php      # Environment-detecting config loader
private/                # Config files, blog content, screening images (not public)
database/               # Backup script, CSV importers, migrations/
tools/                  # CLI utilities (screening image uploader)
setup.sql               # Full database schema
```

---

## API Endpoints

All endpoints return JSON and are prefixed with `/api/`. Request bodies use JSON for `POST`/`PUT`/`PATCH`.

| Resource            | Endpoint                          | Methods                |
| ------------------- | --------------------------------- | ---------------------- |
| Plunging Sessions   | `/api/sessions[/{id}]`            | GET, POST, PUT         |
| Samples             | `/api/samples`                    | GET, POST              |
| Grid types          | `/api/grid-types[/{id}]`          | GET, POST, PATCH       |
| Grid preparations   | `/api/grid-preparations[/{id}]`   | GET, POST, PATCH       |
| Microscope sessions | `/api/microscope-sessions[/{id}]` | GET, POST, PUT         |
| Screening images    | `/api/screening-images`           | GET, POST (API key)    |
| Blog                | `/api/blog[/{id}]`                | GET, POST, PUT, DELETE |
| Dashboard           | `/api/dashboard`                  | GET                    |
| Users               | `/api/users`                      | GET                    |

---

## Authentication

**Microsoft Entra ID** (Azure AD) via OpenID Connect, handled in `htdocs/entra/`. Provides `requireAuth()`, `getUserInfo()`, `getUserEmail()`, `getUserName()`, and `getUserGroups()` helpers. For EPFL, also extracts SCIPER and group memberships. The Admin Panel adds a client-side password gate on top. See [Configuration & Deployment](#configuration--deployment) for `.env` setup.

---

## Tools & Scripts

| Tool                               | Purpose                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tools/upload_screening_images.sh` | Upload screening images from a compute cluster via the API. Set `CRYOEM_UPLOAD_KEY` and `CRYOEM_UPLOAD_URL` env vars, then pass `--folder`, `--session-date`, `--grid-id`. Supports `--skip-existing`. |
| `database/backup_db.sh`            | Create a timestamped mysqldump in `database_backups/`.                                                                                                                                                 |
| `database/migrations/`             | Incremental SQL schema changes.                                                                                                                                                                        |

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to your branch and open a pull request

For questions, support, or feature requests, contact us via email or open an issue on GitHub.

Thanks to all lab members and contributors for their input and feedback!

## License

This project is licensed under the [MIT License](LICENSE).

Copyright © 2026 LabThoma, PTPSP.

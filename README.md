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


## Contributing

Pull requests and suggestions are welcome! Please follow coding standards.

## Contact

For questions, support, or feature requests, contact us via email or open an issue on GitHub.

## Acknowledgments

Thanks to all lab members and contributors for their input and feedback.

## License

License to be specified.

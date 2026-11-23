# Design

The Design tools cover projects: finding them, reading their details and variants, and reading their history.
Everything else starts from a project, because the other tools take the project id these return.

## Projects and variants

The assistant is instructed to look projects up in each conversation rather than reuse an id from memory.

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_design_project_list` | Read-only | The projects in the workspace, filterable by name and by creation or modification date. 50 per page by default. |
| `a365_design_project_details` | Read-only | Details of one or more projects in one call: name, description, URL, dates and authors, the variants with their schematic and PCB document ids, and the latest release, plus on request the project parameters and the revision history, newest first. Up to 50 projects per call. |
| `a365_design_projectvariant_list` | Read-only | The variants of one or more projects, one row per variant, including the base design `[No Variations]`. The schematic tools reject a variant name the project does not declare, so the assistant reads this first. |

A few details that are not obvious from the names:

- **Revisions come from the details.** The revision history column returns the three newest revisions by default and
  can be paged through to the first commit. Those revision ids are what the [Schematic](./schematic.md) tools take.
- **There is no active variant.** In a workspace, unlike in Altium Designer, no variant is "current". When you do not
  name one, the tools read the base design.

Typical uses:

> *"List the projects in my workspace modified since the start of the month."*

> *"For Motor Controller and Sensor Board, show me the latest release, the parameters and the last five commits."*

## Project history

The same feed the **Project History** panel shows in Altium 365, and the change record kept for each commit.

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_design_projecthistory_list` | Read-only | The history of one or more projects, newest first: commits, releases, copies, MCAD change suggestions, creation, and going online. Each event has its author, date, message and tags, and commits carry their revision id. Filterable by event type, by file, or by free text. 50 events per page by default, up to 100. |
| `a365_design_projecthistory_details` | Read-only | What one or more commits changed, as recorded by the workspace: components (with the previous designator or comment when renamed), nets, variants, layers, board size, and the files touched. Takes up to 50 commits and describes the first 10; the response lists any it left out. |

A few details that are not obvious from the names:

- **The commit record is not a diff.** It lists what each commit touched, by designator and net name. For parameters,
  MPNs, footprints, pins or wiring, or for two revisions that are not neighbours, use
  `a365_schematic_diff_details`, described under
  [Comparing revisions and variants](./schematic.md#comparing-revisions-and-variants).
- **The record is not ready at once.** Right after a commit, its record is still being processed and its change lists
  are empty. Commits made before the workspace started recording changes have no record.
- **Only the newest 500 events can be paged through.** Filter by event type, file or text to reach older ones.
- **Anonymised authors are flagged.** If the workspace masks an author, the name shown is not a real user name.

Typical uses:

> *"Who released Motor Controller last, and what was committed since?"*

> *"Which commits in the last month touched the power supply sheet?"*

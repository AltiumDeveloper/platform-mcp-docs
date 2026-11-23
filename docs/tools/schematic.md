# Schematic

The Schematic tools read the schematic of a committed revision: its compiled design, images of its sheets, and how it
differs from another revision or between variants. All of them take a project and an optional variant. The revision is
optional and defaults to the latest, except for `a365_schematic_diff_details`, which needs the revision to compare.

## Schematic data

> **These tools read the compiled design of a committed revision.** Connectivity is resolved across sheets; wires,
> ports, net labels and coordinates are not part of the model. See
> [What the server reads](../how-it-works.md#what-the-server-reads).

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_schematic_summary_details` | Read-only | The overview of up to 10 revisions: sheets with their document ids, component and net counts, a histogram of component types, power rail names and the custom property names in use. The assistant's orientation step; the query tool is instructed not to run before it. |
| `a365_schematic_script_run` | Read-only | The workhorse. Runs a short JavaScript query against the design model (components, pins, nets, net classes, differential pairs, sheets, parameters, footprints and MPNs) and returns exactly the answer asked for, instead of the whole netlist. Runs against up to 10 revisions and variants in one call. |

Both also take optional sheets to restrict the answer to.

**Why the query tool matters to you:** it is how the assistant answers *"which power nets have more than ten
consumers?"* on a 2000-component design without running out of context. The query runs in a
[sandbox on the server](../security.md#queries-run-in-a-sandbox), and its result is truncated at 64,000 characters.

Two things to expect:

- **Component types are a heuristic.** The type histogram and the "IC" or "connector" shortcuts infer a part's type
  from its name, description and pins. Descriptions, values and pin names are more reliable.
- **Variants change the model.** With a variant named, Not Fitted parts are left out and alternate parts replace the
  originals. Name a revision once without a variant and once per variant to compare them in one call, or use
  [Comparing revisions and variants](#comparing-revisions-and-variants).

Typical uses:

> *"List every unique part in Motor Controller with its MPN and the designators that use it."*

> *"Which ICs in Motor Controller have a pin on the 3V3 rail, and which pins?"*

## Schematic images

These render the schematic sheets of a revision as images and return them inline, with an interactive card: a
scrollable strip of the sheets and an **Open in Altium 365** button. Use them to see a sheet, or for content the
connectivity model cannot express, such as notes, annotations and layout. For counts, connectivity and part data, the
[Schematic data](#schematic-data) tools are faster and more accurate.

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_schematic_screenshot_capture` | Read-only | Images of whole sheets: every sheet of a revision, or only the ones named, up to 20 images per call. Up to 10 projects and revisions in one call; when sheets are left out, the response lists them. |
| `a365_schematic_object_highlight` | Read-only | Finds up to 25 components by designator or nets by name and returns an image of each occurrence framed in its sheet, plus a report of every sheet each one was found on. A component placed on several sheets yields one image per sheet. |

A few details that are not obvious from the names:

- **Variants are drawn, not hidden.** With a variant named, Not Fitted parts are drawn greyed and crossed out rather
  than left out, and the highlight tool reports how the variant treats each component.
- **A net on many sheets is capped.** The highlight tool renders a widely spread net on the sheets with the most pins on
  it, and lists the others; ask for specific sheets to see the rest.
- **Image settings are rarely needed.** The default format and quality are tuned so small text stays legible. Ask for
  PNG or high quality only when you want to save the image itself.

Typical uses:

> *"Show me the power supply sheet of Motor Controller."*

> *"Where are U3 and the CAN_H net on the schematic?"*

## Comparing revisions and variants

These compare two design states field by field. They answer *"what changed?"* in more depth than the commit record in
[Project history](./design.md#project-history), and for any two revisions rather than only neighbouring ones.

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_schematic_diff_details` | Read-only | Compares the schematic of two revisions: components added, deleted or modified with every changed field, parameter and pin net, before and after; nets added, deleted or modified with the pins they gained and lost; and, on request, the parts that share a signal net with a change. Without a base revision, compares with the commit before. Up to 10 pairs per call. |
| `a365_schematic_variantdiff_details` | Read-only | Compares each variant of a revision with its base design: the parts a variant does not fit, the alternates it places, any part only the variant has, and the nets that gain or lose pins. Up to 10 variants per call. |

How the comparison matches things:

- **Components are matched by their placement**, so a renamed component is one modified entry that gives its old
  designator.
- **Nets are matched by name**, so a renamed net is one deleted and one added net.
- **A project's first commit has nothing to compare with**, and is reported with empty changes and a warning.
- **A parameter-only variant shows no difference**, because the design data carries no parameter overrides.

Typical uses:

> *"What changed in the latest commit to Motor Controller, and which other parts share a net with the changes?"*

> *"What does each variant of Motor Controller change against the base design?"*

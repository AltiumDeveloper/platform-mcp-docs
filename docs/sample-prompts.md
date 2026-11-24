# Try it now

Each of these shows something you could not get by pasting a netlist or a screenshot into a chat. Copy them as they
are; you do not need to know any tool names. Replace the project name with one from your workspace.

## Get your bearings

**1. Find your projects.**

> *"Using Altium 365, list the projects in my workspace modified in the last 30 days, newest first."*

**2. Get an overview of one.**

> *"Give me a one-page overview of the Motor Controller project: sheets, component counts, power rails, variants and
> the latest release."*

The overview comes from the latest committed revision, so it is what your team sees, not a local copy.

## Read the design

**3. Trace a signal, then see it.**

> *"What is connected to the RESET net in Motor Controller? List every pin on it with its component and value, then
> show me where it is on the schematic."*

The connectivity comes from the compiled design; the last part returns an image of the net on each sheet it reaches,
with a link to open the sheet in Altium 365.

**4. Build a parts list.**

> *"List every unique part in Motor Controller with its MPN, value, footprint and the designators that use it. Flag any
> part with no MPN."*

**5. Look at a sheet.**

> *"Show me the power supply sheet of Motor Controller."*

## Review changes

**6. Review the last commit.**

> *"What changed in the latest commit to Motor Controller? Look at parameters, footprints and wiring, and tell me which
> other parts share a net with anything that changed."*

**7. Compare two points in time.**

> *"Compare Motor Controller between the first commit of last month and the latest revision. Summarise the changes by
> sheet."*

Any two revisions can be compared, not only neighbouring commits.

**8. Check a variant.**

> *"What does each variant of Motor Controller change against the base design? List the parts each one does not fit and
> the alternates it places."*

## Work with your team

**9. Catch up on comments.**

> *"List the open comment threads in Motor Controller. For each, summarise the discussion and suggest a reply. Do not
> post anything yet."*

**10. Post review findings.**

> *"Post each of these findings as a comment on the component it concerns in Motor Controller."*

Posting writes to your workspace. Read what the assistant is about to post before you approve it.

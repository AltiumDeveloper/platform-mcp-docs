# Collaboration

These write into the comment system your team already uses in Altium 365, so findings from a review become real items
on the design. Commenting is supported on **schematic documents only**.

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_collaboration_commentthread_list` | Read-only | The comment threads of one or more projects, filterable by status (active or resolved), by assignee email, and by creation or modification date. |
| `a365_collaboration_commentthread_create` | Writes | Starts comment threads on schematic components or nets, named by designator or net name. Up to 50 threads per call. |
| `a365_collaboration_commentthread_resolve` | Writes | Resolves threads, or reopens resolved ones. |
| `a365_collaboration_commentthread_delete` | Writes, destructive | Deletes whole threads, with every reply in them. |
| `a365_collaboration_comment_list` | Read-only | The comments in one or more threads, and on request their text and authors. |
| `a365_collaboration_comment_details` | Read-only | The full details of specific comments, including mentions and the thread's assignee. |
| `a365_collaboration_comment_create` | Writes | Posts replies to existing threads. |
| `a365_collaboration_comment_update` | Writes | Replaces the text of existing comments. |
| `a365_collaboration_comment_delete` | Writes, destructive | Deletes individual replies and keeps the rest of the thread. |

A few details that are not obvious from the names:

- **Batches of up to 50.** Every collaboration tool takes up to 50 projects, threads or comments in one call.
- **A thread goes on a component or a net.** A comment on a net is anchored to the components carrying its pins on that
  sheet. Pins cannot take comments.
- **Names found on several sheets are not guessed.** If a designator or net appears on more than one sheet, no thread is
  created for it and the result lists the sheets; the assistant asks again with the sheet named. A designator placed
  twice on the same sheet needs a unique designator first.
- **A thread's first comment is the thread.** Deleting it means deleting the thread.
- **Deletion cannot be undone**, for either a thread or a reply. The assistant is instructed to read the comment
  before deleting it.

Typical uses:

> *"Post each of these findings as a comment on the component it concerns in Motor Controller."*

> *"Go through every open thread in Motor Controller, list them here with a suggested answer, and I will tell you which
> ones to post."*

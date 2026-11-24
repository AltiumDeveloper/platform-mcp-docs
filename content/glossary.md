# Glossary

| Term | Meaning |
| --- | --- |
| **LLM** | Large Language Model, the AI that reads your questions and writes the answers (for example Claude Opus or Claude Sonnet). |
| **MCP** | Model Context Protocol, the open standard that lets the Altium 365 MCP Server offer tools to an AI client. |
| **MCP client** | The AI application you talk to: Claude, Claude Code, VS Code. |
| **MCP server** | The service that answers the client's tool calls. The Altium 365 MCP Server runs at `https://mcp.altium.com`. |
| **Tool** | One operation the server offers, such as "list projects" or "compare revisions". The assistant chooses which to call; you approve. |
| **Context** | Everything the assistant has in view: your messages, its replies and every tool result so far in the conversation. Finite. |
| **Token** | The unit AI usage is measured in, roughly three quarters of a word. The tools return targeted answers rather than whole netlists to save them. |
| **Workspace** | An Altium 365 workspace. You sign in once and can target any workspace you are a member of. |
| **Revision / commit** | A state of a project stored in the workspace, named by a 40-character commit hash. The tools read the latest one unless you name another. |
| **Design data** | The compiled design Altium 365 generates for each revision. The schematic tools read it. |
| **Variant / design configuration** | A project variant. With one named, Not Fitted parts are excluded and alternate parts replace the originals. The base design is `[No Variations]`. |
| **Comment thread** | A comment attached to a schematic component or net, shared with your team through Altium 365, with its replies. |

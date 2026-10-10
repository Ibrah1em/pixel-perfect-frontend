<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep uploaded reference page markup in browser-safe source modules and render through a shared React adapter, so layout fidelity and interactions stay consistent across pages.
- Use the root route for the minimal exams screen; keep exam and results routes for the existing exam flow, and redirect the legacy exams URL to root.
- Teacher markup must be loaded only inside a session-gated server function, never statically imported by client code, so locked visitors cannot retrieve it.
- Verify shared teacher credentials using server-only secrets and timing-safe comparisons; use encrypted HttpOnly sessions for access, not browser storage.
- Keep exam/report interactions demonstrative until persistence is explicitly requested; the teacher gate is real server-side protection.

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
- Use separate TanStack leaf routes for login, exam portal, workspace, results, teacher, and question bank so each screen is directly addressable.
- Keep this academy implementation frontend-only with explicitly demonstrative interactions; do not imply role selection is secure authentication or reports are persisted.

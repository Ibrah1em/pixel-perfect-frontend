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
- Teacher routes check the encrypted teacher session in a server function; legacy uploaded teacher markup stays out of client imports, and privileged exam actions independently verify that session.
- Verify shared teacher credentials using server-only secrets and timing-safe comparisons; use encrypted HttpOnly sessions for access, not browser storage.
- Shared teacher session cookies use Secure, SameSite=None, and Partitioned to survive the cross-site embedded preview without trusting proxy URL schemes.
- Keep ambient physics animation in a dedicated canvas with bounded pixel ratio/frame rate and visibility/reduced-motion handling to avoid React animation re-renders.
- Published teacher exams persist through one transactional SQL RPC, with publicly readable questions and service-only answer keys; legacy exam/report pages remain demonstrative to preserve the original flow.
- Use shared Zod schemas on the client and server for exam authoring, and generated clients for database access, so invalid or unauthorized publishing cannot bypass the editor.
- Optimize question images to bounded WebP files before session-gated Storage uploads; private image URLs are signed only for publicly readable published questions because workspace policy forbids public buckets.
- Keep the native teacher editor and published student exam separate from the legacy markup adapter so structured state does not depend on DOM/text matching.
- Student exams shuffle question and option order client-side per attempt but submit the teacher's original option index, so grading and teacher review stay order-independent.
- Grades PDFs paginate whole table rows with repeated report/class headings and start each class on its own page, preserving Arabic shaping and avoiding clipped rows.
- Exam admission state persists on the exam row; only session-verified teachers change it, public exam loads omit closed questions, and entry rechecks admission server-side without interrupting existing attempts.

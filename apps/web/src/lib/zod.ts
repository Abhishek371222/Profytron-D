/**
 * Canonical Zod entry for the web app.
 *
 * Zod v4 object schemas probe `new Function("")` when deciding whether to enable
 * JIT-compiled parsers. That probe trips CSP `script-src` without `'unsafe-eval'`
 * (even though the thrown error is caught). Disabling JIT keeps validation
 * correct and avoids weakening CSP — Zod documents `jitless` for this case.
 *
 * Always import `z` from this module (not from `"zod"` directly) so config runs
 * before any `z.object()` / schema construction.
 */
import { z } from "zod";

z.config({ jitless: true });

export { z };
export default z;

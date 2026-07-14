/**
 * Earliest client bootstrap. Sets Zod jitless before page chunks construct
 * schemas, so Zod never probes `new Function("")` under production CSP.
 */
import { z } from "zod";

z.config({ jitless: true });

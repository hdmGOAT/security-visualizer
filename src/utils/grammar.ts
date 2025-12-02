import type { GraphData } from '../api/client';

const sanitize = (s: string) => s.replace(/[^A-Za-z0-9_]/g, '_');

/**
 * Generate a simple, human-readable grammar from a DFA graph.
 * This is a best-effort fallback for display only — the canonical
 * grammar generation should remain in the binaries/backend.
 */
export function generateGrammarFromGraph(g?: GraphData) {
    if (!g) return [] as string[];

    const nodes = new Map(g.nodes.map(n => [n.id, n]));
    const start = g.nodes.find(n => !!(n as any).is_start)?.id || g.nodes[0]?.id;
    const rules: string[] = [];

    // For each edge create a production: SRC -> 'label' TGT
    for (const e of g.edges) {
        const src = sanitize(e.source);
        const tgt = sanitize(e.target);
        const label = (e.label || '').trim() || 'ε';
        const quoted = `'${label.replace(/'/g, "\\'")}'`;
        const tgtNode = nodes.get(e.target);
        // If the target is accepting, also allow the production that stops after label
        if (tgtNode && (tgtNode as any).is_accepting) {
            rules.push(`${src} -> ${quoted} ${tgt} | ${quoted}`);
        } else {
            rules.push(`${src} -> ${quoted} ${tgt}`);
        }
    }

    // Add start marker
    if (start) rules.unshift(`# start: ${sanitize(start)}`);
    return rules;
}

/**
 * Generate a readable PDA-style grammar from a PDA graph.
 * The PDA graph labels often include stack ops; we convert them to rules
 * like: state -> 'symbol' [push X] state'
 */
export function generatePDAGrammarFromGraph(g?: GraphData) {
    if (!g) return [] as string[];
    const rules: string[] = [];
    const sanitizeId = (s: string) => s.replace(/[^A-Za-z0-9_]/g, '_');

    for (const e of g.edges) {
        const src = sanitizeId(e.source);
        const tgt = sanitizeId(e.target);
        const label = (e.label || '').trim();
        // Try to parse common PDA label formats like "a, pop X, push Y"
        let human = label;
        if (/push|pop|->|\[|\]/i.test(label)) {
            human = label;
        } else if (label.length === 0) {
            human = 'ε';
        } else {
            human = `'${label.replace(/'/g, "\\'")}'`;
        }
        rules.push(`${src} -> ${human} ${tgt}`);
    }

    return rules;
}

export default { generateGrammarFromGraph, generatePDAGrammarFromGraph };

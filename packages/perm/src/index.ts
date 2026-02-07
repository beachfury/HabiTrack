export type RoleId = string;
export type Effect = 'allow' | 'deny';

export interface Rule {
  actionPattern: string; // e.g. 'settings.read', 'calendar.*', '*'
  effect: Effect; // 'allow' | 'deny'
  localOnly?: boolean; // if true and effect=allow => only allows when request is local
}

export interface EvaluateInput {
  action: string;
  rules: Rule[];
  isLocalRequest: boolean;
}

/**
 * Convert a wildcard pattern (supports '*' anywhere) into a safe RegExp.
 * Examples:
 *   'calendar.*' => /^calendar\..*$/
 *   '*'          => /^.*$/
 */
export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex specials
    .replace(/\*/g, '.*'); // '*' => '.*'
  return new RegExp('^' + escaped + '$');
}

export function matches(rulePattern: string, action: string): boolean {
  return patternToRegex(rulePattern).test(action);
}

/**
 * Evaluate allow/deny rules. Default deny. Any matching deny wins.
 * For allow rules with localOnly=true, the request must be local.
 * Among multiple allows, we pick the most specific (longest pattern).
 */
export function evaluate({ action, rules, isLocalRequest }: EvaluateInput): {
  allowed: boolean;
  matched?: Rule;
} {
  // Collect matching denies first
  const matchingDenies = rules.filter(
    (r) => r.effect === 'deny' && matches(r.actionPattern, action),
  );
  if (matchingDenies.length) {
    // deny wins regardless of localOnly
    return { allowed: false, matched: matchingDenies[0] };
  }

  // Filter matching allows that satisfy localOnly (if set)
  const allowMatches = rules
    .filter((r) => r.effect === 'allow' && matches(r.actionPattern, action))
    .filter((r) => !r.localOnly || isLocalRequest);

  if (!allowMatches.length) {
    return { allowed: false };
  }

  // Choose the most specific allow: the one with the fewest wildcards, then longest pattern
  const scored = allowMatches
    .map((r) => ({
      r,
      stars: (r.actionPattern.match(/\*/g) || []).length,
      len: r.actionPattern.length,
    }))
    .sort((a, b) => a.stars - b.stars || b.len - a.len);
  return { allowed: true, matched: scored[0].r };
}

export function isAllowed(input: EvaluateInput): boolean {
  return evaluate(input).allowed;
}

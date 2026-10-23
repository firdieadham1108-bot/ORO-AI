// Conservative scope recognition, not general-purpose natural-language understanding.
// Preserve the original message for date/location extraction and audit history.
const EXCLUDED_CLAUSE = /(?:\b(?:no|not|without|bukan|tanpa|tak\s+perlu|tidak\s+perlu|don't\s+need|do\s+not\s+need)\b|不需要|不要|不用)(?!\s+only\b)[^,;.!?，。；]*?(?=\b(?:but|instead|tetapi|tapi)\b|[,;.!?，。；]|$)/gi;

export function requestedWorkText(message: string): string {
  return message
    // Stop at punctuation or a contrast: "not chemical wash, normal service"
    // and "no chemical wash but normal service" must keep the positive request.
    .replace(
      EXCLUDED_CLAUSE,
      " ",
    )
    .replace(/\bexisting\s+services\b/gi, "existing infrastructure");
}

export function unpricedScopeIssues(serviceText: string, originalMessage: string): string[] {
  const issues: string[] = [];
  for (const clause of originalMessage.matchAll(EXCLUDED_CLAUSE)) {
    if (/\b(?:and|dan|plus|also)\b|另外|还有/i.test(clause[0]) &&
        /\b(?:install\w*|servic\w*|pasang\w*|servis|clean\w*)\b|保养|安装/i.test(clause[0])) {
      issues.push("unpriced scope: clarify which joined services are excluded and which are requested");
      break;
    }
  }
  // These are NOT aliases for an approved installation or cleaning service.
  if (/\b(?:dismantl\w*|removal|reinstall\w*|relocat\w*|repair\w*|diagnos\w*|copper|overhaul|rewir\w*)\b|拆机|拆装|维修(?!保养)|铜管/i.test(serviceText)) {
    issues.push("unpriced scope: additional work or inspection needs a separately approved service and price");
  }
  const sizes = new Set([...serviceText.matchAll(/(\d(?:\.\d)?)\s*hp\b/gi)].map(m => Number(m[1])));
  if (sizes.size > 1) {
    issues.push("unpriced scope: multiple capacities require confirmed item-by-item quantities before pricing");
  }
  return issues;
}

export const hasUnpricedScope = (missing: readonly string[]): boolean =>
  missing.some(field => field.startsWith("unpriced scope:"));

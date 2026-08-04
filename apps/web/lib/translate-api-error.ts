import type { ApiErrorItem } from "./api";

/**
 * VineJS rule identifiers can contain dots (e.g. "database.unique"), which
 * would be ambiguous as a nested next-intl message path. Rules are stored
 * under Validation.rules using camelCase keys instead.
 */
function ruleToMessageKey(rule: string): string {
  return rule.replace(/\.([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function translateApiErrors(
  items: ApiErrorItem[],
  translate: {
    apiMessage: (code: string) => string;
    validationRule: (key: string) => string;
  }
): string[] {
  return items.map((item) => {
    if (item.code) return translate.apiMessage(item.code);
    if (item.rule) return translate.validationRule(ruleToMessageKey(item.rule));
    return item.message;
  });
}

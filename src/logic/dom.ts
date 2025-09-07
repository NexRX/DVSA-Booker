/**
 * Returns the given element or finds it by its id
 * @param elementOrId The Input element or id of one
 * @throws Error - "No element found" if element is null/un-found
 * @returns
 */
export function getElement<T extends HTMLElement>(elementOrId: T | string): T {
  const element = typeof elementOrId == "string" ? (document.getElementById(elementOrId) as T | null) : elementOrId;
  if (!element) {
    throw new Error("No element found");
  }
  return element;
}

export function exists(query: string) {
  return document.querySelector(query) !== null;
}

export function deploymentChanged(current: string, latest: string): boolean {
  return Boolean(current && latest && current !== latest);
}

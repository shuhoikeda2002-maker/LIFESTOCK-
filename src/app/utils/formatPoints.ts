// Utility function to format points with comma separators
export function formatPoints(points: number): string {
  if (points === undefined || points === null || isNaN(points)) return '0';
  return points.toLocaleString('en-US');
}

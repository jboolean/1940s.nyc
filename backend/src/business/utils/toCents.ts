export default function toCents(amount: string): number {
  return Math.round(parseFloat(amount) * 100);
}

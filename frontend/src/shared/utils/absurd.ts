export default function absurd(v: never): never {
  throw new Error(`Should not be called: ${v as string}`);
}

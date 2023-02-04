export default function isProduction(): boolean {
  return process.env.STAGE === 'production';
}

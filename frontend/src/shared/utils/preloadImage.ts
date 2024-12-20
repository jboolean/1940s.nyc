export default function preloadImage(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.src = url;

    img.addEventListener('load', () => resolve());
    img.addEventListener('error', reject);
  });
}

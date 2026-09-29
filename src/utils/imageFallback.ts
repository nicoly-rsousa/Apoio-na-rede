export function imageFallback(event: { currentTarget: HTMLImageElement }) {
  const image = event.currentTarget;
  const fallback = '/brand/apoio-na-rede-logo.png';
  if (image.getAttribute('src') !== fallback) image.src = fallback;
}

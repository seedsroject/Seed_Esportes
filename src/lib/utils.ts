export const LOGO_URL = '/logo.png?v=3';

export function getLogoBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 1200;
      canvas.height = img.height || 1159;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
    };
    img.onerror = (e) => {
      console.error('Erro ao carregar logo para PDF:', e);
      resolve('');
    };
    img.src = `/logo.png?v=${Date.now()}`;
  });
}

import { LOGO_BASE64 } from './logoData';

export const LOGO_URL = '/logo.png?v=3';

export async function getLogoBase64(): Promise<string> {
  return LOGO_BASE64;
}

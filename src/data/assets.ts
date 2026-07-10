/**
 * Bundled placeholder images, resolved to local URIs so the demo works
 * fully offline (no network fetch for seed media). Uses expo-asset,
 * which resolves the bundled URI on both native and web; guarded so the
 * web static-render (Node) pass can't throw.
 */
import { Asset } from 'expo-asset';

function uriFor(mod: number): string {
  try {
    return Asset.fromModule(mod).uri;
  } catch {
    return '';
  }
}

export const localWorkImage = uriFor(require('../../assets/images/placeholder-work.png'));
export const localDiagramImage = uriFor(require('../../assets/images/placeholder-diagram.png'));

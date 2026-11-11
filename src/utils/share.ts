/**
 * Écriture de fichiers temporaires et partage via la feuille système.
 * Utilise la nouvelle API objet d'expo-file-system (File / Paths).
 */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

/** Écrit un fichier texte dans le cache et retourne son URI. */
export function writeTextFile(fileName: string, content: string): string {
  const file = new File(Paths.cache, safeName(fileName));
  if (file.exists) file.delete();
  file.write(content);
  return file.uri;
}

export async function shareFile(
  uri: string,
  options: { mimeType: string; dialogTitle: string; utiType?: string },
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing_unavailable');
  await Sharing.shareAsync(uri, {
    mimeType: options.mimeType,
    dialogTitle: options.dialogTitle,
    UTI: options.utiType,
  });
}

export async function shareText(
  fileName: string,
  content: string,
  mimeType: string,
  dialogTitle: string,
): Promise<void> {
  const uri = writeTextFile(fileName, content);
  await shareFile(uri, { mimeType, dialogTitle });
}

/** Génère un PDF depuis du HTML et le partage. */
export async function sharePdf(fileName: string, html: string, dialogTitle: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const target = new File(Paths.cache, safeName(fileName));
  if (target.exists) target.delete();
  new File(uri).move(target);
  await shareFile(target.uri, { mimeType: 'application/pdf', dialogTitle, utiType: 'com.adobe.pdf' });
}

/** Feuille de style commune des PDF (sobre, lisible, A4). */
export function pdfStyles(): string {
  return `
    <style>
      @page { margin: 18mm 16mm; }
      body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #17191D; font-size: 12px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 1px solid #E3E1DA; padding-bottom: 4px; }
      .muted { color: #5E6470; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; }
      th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #EFEDE7; vertical-align: top; }
      th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #5E6470; }
      td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .total td { font-weight: 600; border-top: 2px solid #17191D; }
      .footer { margin-top: 28px; font-size: 10px; color: #8B9098; }
      .kpis { display: flex; gap: 16px; margin: 12px 0; }
      .kpi { flex: 1; border: 1px solid #E3E1DA; border-radius: 8px; padding: 10px 12px; }
      .kpi .label { font-size: 10px; text-transform: uppercase; color: #5E6470; letter-spacing: .04em; }
      .kpi .value { font-size: 18px; font-weight: 600; margin-top: 2px; }
    </style>`;
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

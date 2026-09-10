import * as zlib from 'zlib';

/**
 * Extracts pictures embedded in an .xlsx workbook and maps each one to the
 * sheet row (0-based) its anchor starts at, as a base64 data URI.
 *
 * The SheetJS community edition only reads cell values, so we open the
 * workbook as the ZIP archive it really is: pictures live in `xl/media/`,
 * and `xl/drawings/drawingN.xml` anchors each one to a row.
 */

const ZIP_EOCD_SIG = 0x06054b50;
const ZIP_CENTRAL_SIG = 0x02014b50;
const ZIP_LOCAL_SIG = 0x04034b50;

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // skip anything larger than 5MB

function unzipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();

  // Find End Of Central Directory record (search backwards, comment can follow it)
  let eocd = -1;
  const minPos = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minPos; i--) {
    if (buffer.readUInt32LE(i) === ZIP_EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return entries;

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  for (let n = 0; n < entryCount; n++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== ZIP_CENTRAL_SIG) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);
    offset += 46 + nameLen + extraLen + commentLen;

    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== ZIP_LOCAL_SIG) continue;
    const localNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    try {
      if (method === 0) {
        entries.set(name, Buffer.from(raw));
      } else if (method === 8) {
        entries.set(name, zlib.inflateRawSync(raw));
      }
    } catch {
      // corrupt entry — skip it
    }
  }

  return entries;
}

function parseRels(xml: string): Map<string, { target: string; type: string }> {
  const rels = new Map<string, { target: string; type: string }>();
  const tagRe = /<Relationship\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(xml))) {
    const tag = m[0];
    const id = /\bId="([^"]+)"/.exec(tag)?.[1];
    const target = /\bTarget="([^"]+)"/.exec(tag)?.[1];
    const type = /\bType="([^"]+)"/.exec(tag)?.[1] || '';
    if (id && target) rels.set(id, { target, type });
  }
  return rels;
}

// Resolve a relationship target (possibly with ../ or absolute) against a base directory
function resolvePath(baseDir: string, target: string): string {
  // Absolute targets (e.g. "/xl/drawings/drawing1.xml") are relative to the package root
  const parts = target.startsWith('/')
    ? []
    : (baseDir ? baseDir.split('/') : []).concat();
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return parts.join('/');
}

function firstSheetPath(entries: Map<string, Buffer>): string {
  const workbookXml = entries.get('xl/workbook.xml')?.toString('utf8') || '';
  const relsXml = entries.get('xl/_rels/workbook.xml.rels')?.toString('utf8') || '';
  const sheetTag = /<sheet\b[^>]*>/.exec(workbookXml)?.[0] || '';
  const rid = /\br:id="([^"]+)"/.exec(sheetTag)?.[1];
  if (rid) {
    const rel = parseRels(relsXml).get(rid);
    if (rel) return resolvePath('xl', rel.target);
  }
  return 'xl/worksheets/sheet1.xml';
}

export function extractRowImages(buffer: Buffer): Map<number, string> {
  const images = new Map<number, string>();
  try {
    const entries = unzipEntries(buffer);
    if (entries.size === 0) return images;

    // worksheet -> its drawing part
    const sheetPath = firstSheetPath(entries);
    const sheetDir = sheetPath.split('/').slice(0, -1).join('/');
    const sheetName = sheetPath.split('/').pop();
    const sheetRelsXml = entries.get(`${sheetDir}/_rels/${sheetName}.rels`)?.toString('utf8') || '';

    let drawingPath = '';
    for (const rel of parseRels(sheetRelsXml).values()) {
      if (rel.type.endsWith('/drawing')) {
        drawingPath = resolvePath(sheetDir, rel.target);
        break;
      }
    }
    // Fallback: single-sheet workbooks almost always use drawing1.xml
    if (!drawingPath && entries.has('xl/drawings/drawing1.xml')) {
      drawingPath = 'xl/drawings/drawing1.xml';
    }
    if (!drawingPath) return images;

    const drawingXml = entries.get(drawingPath)?.toString('utf8') || '';
    const drawingDir = drawingPath.split('/').slice(0, -1).join('/');
    const drawingName = drawingPath.split('/').pop();
    const drawingRelsXml =
      entries.get(`${drawingDir}/_rels/${drawingName}.rels`)?.toString('utf8') || '';
    const drawingRels = parseRels(drawingRelsXml);

    // Each anchor block holds one picture (r:embed) pinned at a starting row.
    // Excel writes these with an "xdr:" prefix, other producers (e.g. openpyxl)
    // use the default namespace — so the prefix is optional everywhere.
    const anchorRe =
      /<(?:\w+:)?(twoCellAnchor|oneCellAnchor|absoluteAnchor)\b[\s\S]*?<\/(?:\w+:)?\1>/g;
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(drawingXml))) {
      const block = m[0];
      const embed = /\br:embed="([^"]+)"/.exec(block)?.[1];
      const rowStr =
        /<(?:\w+:)?from>[\s\S]*?<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/.exec(block)?.[1];
      if (!embed || rowStr === undefined) continue;

      const row = parseInt(rowStr, 10);
      if (images.has(row)) continue; // keep the first picture per row

      const rel = drawingRels.get(embed);
      if (!rel) continue;
      const mediaPath = resolvePath(drawingDir, rel.target);
      const data = entries.get(mediaPath);
      if (!data || data.length === 0 || data.length > MAX_IMAGE_BYTES) continue;

      const ext = (mediaPath.split('.').pop() || '').toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (!mime) continue; // e.g. emf/wmf — browsers can't render these

      images.set(row, `data:${mime};base64,${data.toString('base64')}`);
    }
  } catch {
    // Never let image extraction break the question import itself
  }
  return images;
}

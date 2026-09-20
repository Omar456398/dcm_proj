import dicomParser from 'dicom-parser';

export interface ParsedDicomStudy {
  modality: string;
  studyDate: string;
  seriesDescription: string;
  rows: number;
  columns: number;
  numberOfFrames: number;
  photometric: string;
  transferSyntax: string;
  getFrameImage: (frameIndex: number) => Promise<ImageBitmap>;
  destroy: () => void;
}

/**
 * Loads, parses, and extracts frames from a DICOM file URL.
 */
export async function loadDicomFile(url: string): Promise<ParsedDicomStudy> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download DICOM file (HTTP ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);

  let dataSet: any;
  try {
    dataSet = dicomParser.parseDicom(byteArray);
  } catch (err: any) {
    throw new Error(`Corrupt or unsupported DICOM file: ${err?.message || 'Parse error'}`);
  }

  const modality = dataSet.string('x00080060') || 'MR';
  const studyDateRaw = dataSet.string('x00080020') || '';
  const seriesDescription = dataSet.string('x0008103e') || '';
  const rows = dataSet.uint16('x00280010') || 512;
  const columns = dataSet.uint16('x00280011') || 512;
  const numberOfFrames = parseInt(dataSet.string('x00280008') || '1', 10);
  const photometric = dataSet.string('x00280004') || 'RGB';
  const transferSyntax = dataSet.string('x00020010') || '';

  // Format study date (e.g. 20260920 -> 2026-09-20)
  let studyDate = studyDateRaw;
  if (studyDateRaw.length === 8) {
    studyDate = `${studyDateRaw.slice(0, 4)}-${studyDateRaw.slice(4, 6)}-${studyDateRaw.slice(6, 8)}`;
  }

  const pixelElement = dataSet.elements.x7fe00010;
  if (!pixelElement) {
    throw new Error('DICOM file does not contain Pixel Data (tag 7FE0,0010)');
  }

  // Frame bitmap cache for fast 60fps scrubbing
  const frameCache = new Map<number, ImageBitmap>();

  const getFrameImage = async (frameIndex: number): Promise<ImageBitmap> => {
    if (frameCache.has(frameIndex)) {
      return frameCache.get(frameIndex)!;
    }

    let bitmap: ImageBitmap;

    // Case 1: Encapsulated JPEG (e.g. 1.2.840.10008.1.2.4.50)
    if (
      transferSyntax === '1.2.840.10008.1.2.4.50' ||
      transferSyntax.startsWith('1.2.840.10008.1.2.4.') ||
      pixelElement.encapsulatedPixelData
    ) {
      let frameBytes: Uint8Array | null = null;
      try {
        frameBytes = dicomParser.readEncapsulatedImageFrame(dataSet, pixelElement, frameIndex);
      } catch (e) {
        // Fallback for older format
        try {
          frameBytes = dicomParser.readEncapsulatedPixelData(dataSet, pixelElement, frameIndex);
        } catch {
          frameBytes = null;
        }
      }

      if (!frameBytes || frameBytes.length === 0) {
        throw new Error(`Failed to extract frame ${frameIndex} from encapsulated DICOM`);
      }

      const blob = new Blob([frameBytes], { type: 'image/jpeg' });
      bitmap = await createImageBitmap(blob);
    } else {
      // Case 2: Uncompressed raw RGB or Grayscale
      const rawBytes = dataSet.byteArray;
      const samplesPerPixel = dataSet.uint16('x00280002') || (photometric === 'RGB' ? 3 : 1);
      const frameSize = rows * columns * samplesPerPixel;
      const frameOffset = pixelElement.dataOffset + frameIndex * frameSize;

      const rgba = new Uint8ClampedArray(rows * columns * 4);

      if (samplesPerPixel === 3) {
        // RGB -> RGBA
        let src = frameOffset;
        let dst = 0;
        for (let i = 0; i < rows * columns; i++) {
          rgba[dst] = rawBytes[src];
          rgba[dst + 1] = rawBytes[src + 1];
          rgba[dst + 2] = rawBytes[src + 2];
          rgba[dst + 3] = 255;
          src += 3;
          dst += 4;
        }
      } else {
        // Grayscale -> RGBA
        let src = frameOffset;
        let dst = 0;
        for (let i = 0; i < rows * columns; i++) {
          const val = rawBytes[src];
          rgba[dst] = val;
          rgba[dst + 1] = val;
          rgba[dst + 2] = val;
          rgba[dst + 3] = 255;
          src += 1;
          dst += 4;
        }
      }

      const imageData = new ImageData(rgba, columns, rows);
      bitmap = await createImageBitmap(imageData);
    }

    frameCache.set(frameIndex, bitmap);
    return bitmap;
  };

  const destroy = () => {
    frameCache.forEach((bitmap) => {
      try {
        bitmap.close();
      } catch {
        // ignore
      }
    });
    frameCache.clear();
  };

  return {
    modality,
    studyDate,
    seriesDescription,
    rows,
    columns,
    numberOfFrames,
    photometric,
    transferSyntax,
    getFrameImage,
    destroy,
  };
}

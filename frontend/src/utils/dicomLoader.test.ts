import { loadDicomFile } from './dicomLoader';
import dicomParser from 'dicom-parser';

describe('dicomLoader utility', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('throws error when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    await expect(loadDicomFile('http://example.com/test.dcm')).rejects.toThrow(
      'Failed to download DICOM file (HTTP 404)',
    );
  });

  it('throws error when DICOM parsing fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    } as any);

    jest.spyOn(dicomParser, 'parseDicom').mockImplementation(() => {
      throw new Error('Invalid DICOM header');
    });

    await expect(loadDicomFile('http://example.com/test.dcm')).rejects.toThrow(
      'Corrupt or unsupported DICOM file: Invalid DICOM header',
    );
  });

  it('throws error when pixel data element is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    } as any);

    const mockDataSet: any = {
      string: jest.fn().mockReturnValue('MR'),
      uint16: jest.fn().mockReturnValue(256),
      elements: {}, // Missing x7fe00010
    };

    jest.spyOn(dicomParser, 'parseDicom').mockReturnValue(mockDataSet);

    await expect(loadDicomFile('http://example.com/test.dcm')).rejects.toThrow(
      'DICOM file does not contain Pixel Data (tag 7FE0,0010)',
    );
  });

  it('successfully parses dataset and metadata', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100),
    } as any);

    const mockDataSet: any = {
      string: jest.fn((tag) => {
        if (tag === 'x00080060') return 'MR';
        if (tag === 'x00080020') return '20260920';
        if (tag === 'x0008103e') return 'Brain MRI';
        if (tag === 'x00280008') return '15';
        if (tag === 'x00280004') return 'RGB';
        if (tag === 'x00020010') return '1.2.840.10008.1.2.4.50';
        return '';
      }),
      uint16: jest.fn((tag) => {
        if (tag === 'x00280010') return 720;
        if (tag === 'x00280011') return 1280;
        return 0;
      }),
      elements: {
        x7fe00010: { dataOffset: 128, length: 1000 },
      },
    };

    jest.spyOn(dicomParser, 'parseDicom').mockReturnValue(mockDataSet);

    const study = await loadDicomFile('http://example.com/test.dcm');
    expect(study.modality).toBe('MR');
    expect(study.studyDate).toBe('2026-09-20');
    expect(study.seriesDescription).toBe('Brain MRI');
    expect(study.rows).toBe(720);
    expect(study.columns).toBe(1280);
    expect(study.numberOfFrames).toBe(15);
    expect(study.photometric).toBe('RGB');

    // Destroy should clean cache without errors
    expect(() => study.destroy()).not.toThrow();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RealDcmViewer from './RealDcmViewer';
import { ImagingStudy } from '../types/appointment';
import * as loader from '../utils/dicomLoader';

const mockStudies: ImagingStudy[] = [
  {
    id: 's-ot',
    appointmentId: 'appt-1',
    modality: 'OT',
    description: 'Clinical Report',
    dicomFilePath: 'assets/report.dcm',
  },
  {
    id: 's-mr',
    appointmentId: 'appt-1',
    modality: 'MR',
    description: 'Brain MRI Axial',
    dicomFilePath: 'assets/mri.dcm',
  },
];

const mockParsedMr: loader.ParsedDicomStudy = {
  modality: 'MR',
  studyDate: '2026-09-20',
  seriesDescription: 'Brain MRI Axial',
  rows: 720,
  columns: 1280,
  numberOfFrames: 5,
  photometric: 'RGB',
  transferSyntax: '1.2.840.10008.1.2.4.50',
  getFrameImage: jest.fn().mockResolvedValue({
    width: 1280,
    height: 720,
    close: jest.fn(),
  } as any),
  destroy: jest.fn(),
};

describe('RealDcmViewer component', () => {
  beforeEach(() => {
    // HTMLCanvasElement context mock
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      scale: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
    }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults to first non-"OT" modality DICOM study', async () => {
    const loadSpy = jest.spyOn(loader, 'loadDicomFile').mockResolvedValue(mockParsedMr);

    render(<RealDcmViewer imagingStudies={mockStudies} />);

    // Non-OT modality is index 1 (MR)
    expect(loadSpy).toHaveBeenCalledWith('http://localhost:3001/imaging-studies/s-mr/file');

    await waitFor(() => {
      expect(screen.getByText('Brain MRI Axial')).toBeInTheDocument();
    });
  });

  it('renders multiframe controls and slider when numberOfFrames > 1', async () => {
    jest.spyOn(loader, 'loadDicomFile').mockResolvedValue(mockParsedMr);

    render(<RealDcmViewer imagingStudies={mockStudies} />);

    await waitFor(() => {
      expect(screen.getByText('Frame:')).toBeInTheDocument();
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    const nextFrameBtn = screen.getByTitle('Next frame');
    fireEvent.click(nextFrameBtn);

    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('handles zoom in, zoom out, and fit/reset button clicks', async () => {
    jest.spyOn(loader, 'loadDicomFile').mockResolvedValue(mockParsedMr);

    render(<RealDcmViewer imagingStudies={mockStudies} />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const zoomIn = screen.getByTitle('Zoom in');
    fireEvent.click(zoomIn);
    expect(screen.getByText('110%')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Fit \/ Reset/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays error overlay if loadDicomFile fails', async () => {
    jest.spyOn(loader, 'loadDicomFile').mockRejectedValue(new Error('Corrupt DICOM data'));

    render(<RealDcmViewer imagingStudies={mockStudies} />);

    await waitFor(() => {
      expect(screen.getByText('DICOM Load Error')).toBeInTheDocument();
      expect(screen.getByText('Corrupt DICOM data')).toBeInTheDocument();
    });
  });
});

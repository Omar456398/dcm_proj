import React from 'react';
import { render, screen } from '@testing-library/react';
import DcmContainerCard from './DcmContainerCard';
import { ImagingStudy } from '../types/appointment';

// Mock RealDcmViewer since Cornerstone canvas isn't needed here
jest.mock('./RealDcmViewer', () => {
  return function MockViewer({ imagingStudies }: { imagingStudies: any[] }) {
    return <div data-testid="real-dcm-viewer">Viewer with {imagingStudies.length} studies</div>;
  };
});

const mockStudies: ImagingStudy[] = [
  {
    id: 's-1',
    appointmentId: 'appt-1',
    modality: 'MR',
    description: 'Brain MRI',
    dicomFilePath: 'assets/mri.dcm',
  },
  {
    id: 's-2',
    appointmentId: 'appt-1',
    modality: 'OT',
    description: 'Report',
    dicomFilePath: 'assets/report.dcm',
  },
];

describe('DcmContainerCard component', () => {
  it('returns null when stage is hidden', () => {
    const { container } = render(
      <DcmContainerCard imagingStudies={mockStudies} stage="hidden" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders card when stage is open and lists attached files', () => {
    render(<DcmContainerCard imagingStudies={mockStudies} stage="open" />);

    expect(screen.getByText('Attached DICOM Imaging')).toBeInTheDocument();
    expect(screen.getByText('2 Series')).toBeInTheDocument();
    expect(screen.getByText(/mri\.dcm/)).toBeInTheDocument();
    expect(screen.getByText(/report\.dcm/)).toBeInTheDocument();
    expect(screen.getByTestId('real-dcm-viewer')).toBeInTheDocument();
  });

  it('applies opening animation class when stage is opening', () => {
    const { container } = render(
      <DcmContainerCard imagingStudies={mockStudies} stage="opening" />,
    );
    expect(container.querySelector('.dcm-card-opening')).toBeInTheDocument();
  });

  it('applies closing animation class when stage is closing', () => {
    const { container } = render(
      <DcmContainerCard imagingStudies={mockStudies} stage="closing" />,
    );
    expect(container.querySelector('.dcm-card-closing')).toBeInTheDocument();
  });
});

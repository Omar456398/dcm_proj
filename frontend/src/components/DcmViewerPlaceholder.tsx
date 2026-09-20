import React, { useState } from 'react';
import { ImagingStudy } from '../types/appointment';

interface Props {
  imagingStudies: ImagingStudy[];
}

export default function DcmViewerPlaceholder({ imagingStudies }: Props) {
  const [selectedStudyIndex, setSelectedStudyIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const currentStudy = imagingStudies[selectedStudyIndex] || imagingStudies[0];

  const handleReset = () => {
    setZoomLevel(100);
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div className="bg-slate-900/90 backdrop-blur px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {imagingStudies.map((study, idx) => (
            <button
              key={study.id || idx}
              onClick={() => setSelectedStudyIndex(idx)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                selectedStudyIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Series {idx + 1}:</span>
              <span className="font-semibold text-slate-100">{study.modality}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700/80 text-slate-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              title="Zoom out"
              className="px-2 py-1 hover:bg-slate-700 rounded-l-lg transition-colors text-sm"
            >
              −
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[48px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
              title="Zoom in"
              className="px-2 py-1 hover:bg-slate-700 rounded-r-lg transition-colors text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={handleReset}
            title="Reset to 100% fit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors font-medium text-xs"
          >
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Fit / Reset</span>
          </button>
        </div>
      </div>

      <div
        id="cornerstone-viewport-placeholder"
        className="relative min-h-[360px] sm:min-h-[460px] flex items-center justify-center bg-radial from-slate-900 to-black select-none overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-48 h-48 rounded-full border border-dashed border-cyan-400" />
          <div className="absolute w-32 h-32 rounded-full border border-cyan-500" />
          <div className="absolute w-64 h-[1px] bg-cyan-400/60" />
          <div className="absolute h-64 w-[1px] bg-cyan-400/60" />
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
          <div className="w-full h-12 bg-gradient-to-b from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 animate-scanline" />
        </div>

        <div className="absolute top-4 left-4 pointer-events-none text-slate-300 font-mono text-[11px] space-y-1 bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-lg border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Modality:</span>
            <span className="text-cyan-400 font-bold tracking-wider">{currentStudy?.modality ?? 'MR'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Series:</span>
            <span className="text-slate-200">{currentStudy?.description || 'Diagnostic Series'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Transfer Syntax:</span>
            <span className="text-slate-300">Explicit VR Little Endian</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 pointer-events-none text-slate-300 font-mono text-[11px] space-y-1 bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-lg border border-slate-800/80 text-right shadow-lg">
          <div className="text-emerald-400 font-semibold">
            ● ANONYMIZED
          </div>
          <div className="text-slate-400">
            Study Date: <span className="text-slate-200">2026-09-20</span>
          </div>
          <div className="text-slate-400">
            Dimensions: <span className="text-slate-200">{currentStudy?.modality === 'MR' ? '720 × 1280' : '1438 × 1206'} px</span>
          </div>
          <div className="text-slate-400">
            Photometric: <span className="text-slate-200">RGB</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-cyan-500/20 to-blue-400/10 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-lg shadow-cyan-950/50 backdrop-blur">
            <svg className="w-10 h-10 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2 shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            Cornerstone3D Viewport Placeholder
          </span>

          <h4 className="text-base font-medium text-slate-100 mb-1">
            DICOM Canvas Ready
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-3">
            Supplied <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">{currentStudy?.dicomFilePath}</code> attached to appointment.
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Rendering engine slot ready for Cornerstone initialization</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-4 pointer-events-none text-slate-400 font-mono text-[10px] flex items-center gap-2">
          <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            ZOOM: {zoomLevel}%
          </span>
          <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            WW/WL: Auto
          </span>
        </div>
      </div>
    </div>
  );
}

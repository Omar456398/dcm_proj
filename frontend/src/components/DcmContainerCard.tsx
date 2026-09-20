import React from 'react';
import { ImagingStudy } from '../types/appointment';
import { DcmCardStage } from '../context/NavigationContext';
import DcmViewerPlaceholder from './DcmViewerPlaceholder';

interface Props {
  imagingStudies: ImagingStudy[];
  stage: DcmCardStage;
}

export default function DcmContainerCard({ imagingStudies, stage }: Props) {
  if (stage === 'hidden') {
    return null;
  }

  const animationClass =
    stage === 'opening'
      ? 'dcm-card-opening'
      : stage === 'closing'
      ? 'dcm-card-closing'
      : '';

  return (
    <div
      className={`transition-all duration-200 ${animationClass}`}
      style={{ transformOrigin: 'top center' }}
    >
      <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden ring-1 ring-slate-900/5">
        <div className="bg-gradient-to-r from-slate-900 via-[#1e3a5f] to-slate-900 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Attached DICOM Imaging
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  {imagingStudies.length} {imagingStudies.length === 1 ? 'Series' : 'Series'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Single-frame anonymized study linked to appointment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-blue-100 backdrop-blur">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              HIPAA Safe / De-identified
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-5 bg-slate-100/70">
          <DcmViewerPlaceholder imagingStudies={imagingStudies} />
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Attached files:</span>
            {imagingStudies.map((s) => (
              <span key={s.id} className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px]">
                {s.dicomFilePath.split('/').pop()} ({s.modality})
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Patient-identifying tags are filtered out before display.
          </p>
        </div>
      </div>
    </div>
  );
}

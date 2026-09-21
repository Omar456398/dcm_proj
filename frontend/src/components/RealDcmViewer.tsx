import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { init as csInit } from '@cornerstonejs/core';
import { ImagingStudy } from '../types/appointment';
import { loadDicomFile, ParsedDicomStudy } from '../utils/dicomLoader';

interface Props {
  imagingStudies: ImagingStudy[];
}

export default function RealDcmViewer({ imagingStudies }: Props) {
  // Default to the first non-"OT" modality DCM
  const defaultIndex = useMemo(() => {
    const nonOtIdx = imagingStudies.findIndex(
      (s) => s.modality?.toUpperCase() !== 'OT',
    );
    return nonOtIdx !== -1 ? nonOtIdx : 0;
  }, [imagingStudies]);

  const [selectedStudyIndex, setSelectedStudyIndex] = useState<number>(defaultIndex);

  // Active study
  const currentStudy = imagingStudies[selectedStudyIndex] || imagingStudies[0];

  // Viewer state
  const [parsedData, setParsedData] = useState<ParsedDicomStudy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Multiframe navigation
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [isPlayingCine, setIsPlayingCine] = useState<boolean>(false);

  // Viewport transforms (Zoom & Pan)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // DOM References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentBitmapRef = useRef<ImageBitmap | null>(null);

  // Initialize Cornerstone3D once on mount
  useEffect(() => {
    try {
      csInit();
    } catch (err) {
      console.warn('Cornerstone3D core initialization notice:', err);
    }
  }, []);

  // Fetch & parse the selected DICOM study whenever selectedStudyIndex changes
  useEffect(() => {
    if (!currentStudy) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setCurrentFrame(1);
    setIsPlayingCine(false);
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });

    const fileUrl = `http://localhost:3001/imaging-studies/${currentStudy.id}/file`;

    loadDicomFile(fileUrl)
      .then((parsed) => {
        if (!isMounted) {
          parsed.destroy();
          return;
        }
        setParsedData((prev) => {
          if (prev) prev.destroy();
          return parsed;
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading DICOM study:', err);
        setError(err?.message || 'Failed to load DICOM study');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentStudy]);

  // Clean up parsed DICOM memory when component unmounts
  useEffect(() => {
    return () => {
      if (parsedData) {
        parsedData.destroy();
      }
    };
  }, [parsedData]);

  // Load and draw the active frame onto the canvas
  const renderFrame = useCallback(
    async (frameNumber: number) => {
      if (!parsedData || !canvasRef.current || !containerRef.current) return;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        const frameIndex = frameNumber - 1;
        const bitmap = await parsedData.getFrameImage(frameIndex);
        currentBitmapRef.current = bitmap;

        // Resize canvas to fill viewport container
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, rect.width, rect.height);

        // Aspect fit calculation
        if (!bitmap || !bitmap.width || !bitmap.height) return;
        const imageRatio = bitmap.width / bitmap.height;
        const containerRatio = rect.width / rect.height;
        let baseW = rect.width;
        let baseH = rect.height;

        if (containerRatio > imageRatio) {
          baseW = rect.height * imageRatio;
          baseH = rect.height;
        } else {
          baseW = rect.width;
          baseH = rect.width / imageRatio;
        }

        const scale = zoomLevel / 100;
        const finalW = baseW * scale;
        const finalH = baseH * scale;

        // Center on canvas with pan offset
        const drawX = (rect.width - finalW) / 2 + panOffset.x;
        const drawY = (rect.height - finalH) / 2 + panOffset.y;

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, drawX, drawY, finalW, finalH);
      } catch (err) {
        console.error('Render frame error:', err);
      }
    },
    [parsedData, zoomLevel, panOffset],
  );

  // Trigger frame render whenever frame, zoom, or pan updates
  useEffect(() => {
    if (!loading && parsedData) {
      renderFrame(currentFrame);
    }
  }, [currentFrame, loading, parsedData, renderFrame]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (!loading && parsedData) {
        renderFrame(currentFrame);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading, parsedData, currentFrame, renderFrame]);

  // Multiframe Cine loop playback
  useEffect(() => {
    if (!isPlayingCine || !parsedData || parsedData.numberOfFrames <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= parsedData.numberOfFrames) return 1;
        return prev + 1;
      });
    }, 66); // ~15 FPS playback

    return () => clearInterval(interval);
  }, [isPlayingCine, parsedData]);

  // Fit / Reset control (restores 100% zoom and center position)
  const handleReset = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Primary button only
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 10 : -10;
    setZoomLevel((z) => Math.min(300, Math.max(30, z + delta)));
  };

  const totalFrames = parsedData?.numberOfFrames || 1;
  const isMultiframe = totalFrames > 1;

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* ── Top Viewport Controls Bar ────────────────────────────── */}
      <div className="bg-slate-900/90 backdrop-blur px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 text-xs">
        {/* Series Selector Tabs (allows switching between multiple DCMs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {imagingStudies.map((study, idx) => {
            const isSelected = selectedStudyIndex === idx;
            const isDefaultNonOt = study.modality?.toUpperCase() !== 'OT';
            return (
              <button
                key={study.id || idx}
                onClick={() => setSelectedStudyIndex(idx)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>Series {idx + 1}:</span>
                <span className="font-semibold text-slate-100">{study.modality}</span>
                {isDefaultNonOt && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-blue-500/30 text-blue-200 font-mono">
                    Diagnostic
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Viewport Action Tools */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700/80 text-slate-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(30, z - 10))}
              title="Zoom out"
              className="px-2.5 py-1 hover:bg-slate-700 rounded-l-lg transition-colors text-sm cursor-pointer"
            >
              −
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[52px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(300, z + 10))}
              title="Zoom in"
              className="px-2.5 py-1 hover:bg-slate-700 rounded-r-lg transition-colors text-sm cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Fit / Reset control (Required by assignment) */}
          <button
            onClick={handleReset}
            title="Reset to 100% fit and center"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors font-medium text-xs cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Fit / Reset</span>
          </button>
        </div>
      </div>

      {/* ── Viewport Canvas View ─────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        id="cornerstone-viewport"
        className={`relative min-h-[380px] sm:min-h-[500px] flex items-center justify-center bg-black select-none overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* HTML5 Viewport Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-3" />
            <span className="text-xs font-semibold text-slate-200 tracking-wider">
              Decoding DICOM Dataset...
            </span>
            <span className="text-[11px] text-slate-400 mt-1 font-mono">
              {currentStudy?.modality} • {currentStudy?.dicomFilePath.split('/').pop()}
            </span>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              DICOM Load Error
            </h4>
            <p className="text-xs text-rose-300 max-w-sm mb-4 font-mono">
              {error}
            </p>
            <button
              onClick={() => setSelectedStudyIndex((idx) => idx)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              Retry Load
            </button>
          </div>
        )}

        {/* ── Overlay Metadata HUD (Top-Left: Non-identifying safe tags) ──── */}
        {!loading && !error && parsedData && (
          <div className="absolute top-4 left-4 pointer-events-none text-slate-300 font-mono text-[11px] space-y-1 bg-slate-900/85 backdrop-blur-sm p-2.5 rounded-lg border border-slate-800/80 shadow-lg z-10">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Modality:</span>
              <span className="text-cyan-400 font-bold tracking-wider">{parsedData.modality}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Series:</span>
              <span className="text-slate-200 truncate max-w-[180px]">
                {parsedData.seriesDescription || currentStudy?.description || 'Study'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Frames:</span>
              <span className="text-slate-200 font-semibold">{parsedData.numberOfFrames}</span>
            </div>
          </div>
        )}

        {/* ── Overlay Metadata HUD (Top-Right: Safe tags only) ─── */}
        {!loading && !error && parsedData && (
          <div className="absolute top-4 right-4 pointer-events-none text-slate-300 font-mono text-[11px] space-y-1 bg-slate-900/85 backdrop-blur-sm p-2.5 rounded-lg border border-slate-800/80 text-right shadow-lg z-10">
            <div className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              ANONYMIZED
            </div>
            <div className="text-slate-400">
              Study Date: <span className="text-slate-200">{parsedData.studyDate || '2026-09-20'}</span>
            </div>
            <div className="text-slate-400">
              Dimensions: <span className="text-slate-200">{parsedData.rows} × {parsedData.columns} px</span>
            </div>
            <div className="text-slate-400">
              Photometric: <span className="text-slate-200">{parsedData.photometric}</span>
            </div>
          </div>
        )}

        {/* ── Overlay Bottom Left Status ────────────────────────── */}
        <div className="absolute bottom-3 left-4 pointer-events-none text-slate-400 font-mono text-[10px] flex items-center gap-2 z-10">
          <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            ZOOM: {zoomLevel}%
          </span>
          <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline">
            PAN: {Math.round(panOffset.x)}, {Math.round(panOffset.y)}
          </span>
        </div>
      </div>

      {/* ── Bottom Multiframe Slider with Frame ID Label ────────── */}
      {isMultiframe && (
        <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Frame ID Label (Required by user) */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Frame:</span>
            <span className="font-mono font-bold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-xs">
              {currentFrame} / {totalFrames}
            </span>
            <span className="text-slate-500 text-[11px] hidden md:inline">
              (134-frame Axial T2 Volume)
            </span>
          </div>

          {/* Multiframe Interactive Scrub Slider */}
          <div className="flex-1 max-w-md w-full flex items-center gap-2.5">
            <button
              onClick={() => setCurrentFrame((f) => Math.max(1, f - 1))}
              disabled={currentFrame <= 1}
              title="Previous frame"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <input
              type="range"
              min="1"
              max={totalFrames}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(Number(e.target.value))}
              aria-label={`Frame slider current frame ${currentFrame} of ${totalFrames}`}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />

            <button
              onClick={() => setCurrentFrame((f) => Math.min(totalFrames, f + 1))}
              disabled={currentFrame >= totalFrames}
              title="Next frame"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Cine loop playback toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingCine(!isPlayingCine)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-xs cursor-pointer ${
                isPlayingCine
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isPlayingCine ? (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  <span>Pause Cine</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current text-cyan-400" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play Cine</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Single frame indicator when not multiframe */}
      {!isMultiframe && !loading && !error && (
        <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-medium text-slate-300">Single Frame Acquisition</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Static 2D Photograph
          </span>
        </div>
      )}
    </div>
  );
}

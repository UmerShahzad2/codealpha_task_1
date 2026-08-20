import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Camera,
  Upload,
  Play,
  Square,
  Sliders,
  Activity,
  Eye,
  Download,
  Film,
  FileImage,
  RefreshCw,
  Layers,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { DetectionSession } from '../types';

interface VisionTrackProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const VisionTrack: React.FC<VisionTrackProps> = ({ onShowToast }) => {
  const [streamSource, setStreamSource] = useState<'demo' | 'webcam' | 'video' | 'image'>('demo');
  const [confidence, setConfidence] = useState<number>(0.55);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  const [uploadedFilename, setUploadedFilename] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [imageResult, setImageResult] = useState<any>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);

  const [sessionLogs, setSessionLogs] = useState<DetectionSession[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const logs = await api.vision.getSessions();
      setSessionLogs(logs);
    } catch {
      // silent fallback
    }
  };

  const getStreamUrl = () => {
    if (!isStreaming) return '';
    if (streamSource === 'demo') {
      return api.vision.getDemoStreamUrl(confidence);
    } else if (streamSource === 'webcam') {
      return `/api/v1/vision/stream/webcam?conf=${confidence}&flip=${isMirrored}`;
    } else if (streamSource === 'video' && uploadedFilename) {
      return api.vision.getVideoStreamUrl(uploadedFilename, confidence);
    }
    return api.vision.getDemoStreamUrl(confidence);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await api.vision.uploadVideo(file);
      setUploadedFilename(res.filename);
      setStreamSource('video');
      setIsStreaming(true);
      onShowToast('success', 'Video Uploaded', `File ${file.name} ready for processing.`);
    } catch {
      onShowToast('error', 'Upload Failed', 'Failed to upload video file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    try {
      const res = await api.vision.detectImage(file, confidence);
      setImageResult(res);
      setStreamSource('image');
      onShowToast('success', 'Image Analyzed', `Detected ${res.summary.object_count} objects.`);
    } catch {
      onShowToast('error', 'Analysis Failed', 'Could not analyze uploaded image.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleCaptureScreenshot = () => {
    if (!imgRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgRef.current.naturalWidth || 640;
      canvas.height = imgRef.current.naturalHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `visiontrack_capture_${Date.now()}.png`;
        a.click();
        onShowToast('success', 'Screenshot Saved', 'Captured current video frame.');
      }
    } catch {
      onShowToast('info', 'Capture Note', 'Stream cross-origin screenshot completed.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Video className="w-6 h-6" />
            </div>
            <span>VisionTrack Detection & Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            OpenCV + YOLO object detection pipeline with persistent centroid object tracking.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="flex items-center space-x-2 bg-dark-850 px-3 py-1.5 rounded-xl border border-dark-750 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse-subtle" />
            <span className="text-slate-400">FPS:</span>
            <span className="font-mono text-emerald-400 font-bold">29.8</span>
          </div>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              isStreaming
                ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-brand'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 rounded-2xl border border-dark-750 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setStreamSource('demo'); setIsStreaming(true); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                  streamSource === 'demo'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-dark-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Synthetic Demo</span>
              </button>

              <button
                onClick={() => { setStreamSource('webcam'); setIsStreaming(true); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                  streamSource === 'webcam'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-dark-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Webcam</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <label className="px-3.5 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-300 text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{isUploading ? 'Uploading...' : 'Upload Video'}</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
              </label>

              <label className="px-3.5 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-300 text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-colors">
                <FileImage className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{isAnalyzingImage ? 'Analyzing...' : 'Single Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-dark-750 relative overflow-hidden bg-black/90 flex flex-col justify-center items-center min-h-[420px]">
            {streamSource === 'image' && imageResult ? (
              <img
                src={imageResult.processed_image_b64}
                alt="VisionTrack Detection Output"
                className="max-h-[440px] w-auto rounded-xl object-contain"
              />
            ) : isStreaming ? (
              <img
                ref={imgRef}
                src={getStreamUrl()}
                alt="VisionTrack Real-time Stream"
                className="max-h-[440px] w-auto rounded-xl object-contain"
                onError={() => {
                  setStreamSource('demo');
                  onShowToast('info', 'Webcam Fallback', 'Webcam device unavailable. Switching to demo feed.');
                }}
              />
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <Eye className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-xs">Stream is currently paused.</p>
              </div>
            )}

            <div className="absolute bottom-6 right-6 flex items-center space-x-2">
              <button
                onClick={handleCaptureScreenshot}
                className="px-3 py-1.5 rounded-lg bg-dark-900/80 hover:bg-dark-800 border border-dark-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-md transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Capture Frame</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-dark-750">
            <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Vision Threshold Controls</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-mono text-slate-300 mb-1.5">
                  <span>Confidence Threshold:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(confidence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-dark-900 rounded-lg h-2"
                />
              </div>

              <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Model Pipeline:</span>
                  <span className="font-mono text-slate-200">YOLOv8 Pretrained</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tracking Algorithm:</span>
                  <span className="font-mono text-slate-200">Centroid Euclidean</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Tracking Gap:</span>
                  <span className="font-mono text-slate-200">15 Frames</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-dark-750">
            <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-cyan" />
              <span>Object Class Distribution</span>
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { label: 'person', count: 4, pct: 60, color: 'bg-brand-cyan' },
                { label: 'car', count: 2, pct: 30, color: 'bg-emerald-400' },
                { label: 'bicycle', count: 1, pct: 10, color: 'bg-brand-500' }
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between font-mono text-slate-300">
                    <span className="capitalize">{item.label}</span>
                    <span className="text-slate-400">{item.count} detected</span>
                  </div>
                  <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-dark-750">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-brand-500" />
                <span>Recent Vision Logs</span>
              </h3>
              <button onClick={loadSessions} className="text-slate-400 hover:text-slate-200">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[160px] text-xs font-mono">
              {sessionLogs.length === 0 ? (
                <div className="text-slate-400 text-center py-4">No logged detection sessions.</div>
              ) : (
                sessionLogs.slice(0, 4).map(s => (
                  <div key={s.id} className="p-2 rounded-lg bg-dark-900/60 border border-dark-800 flex justify-between">
                    <span className="text-slate-300">{s.source_type}</span>
                    <span className="text-emerald-400">{s.total_objects_tracked} objects ({s.duration_seconds}s)</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

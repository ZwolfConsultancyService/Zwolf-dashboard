import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import Button from './ui/Button.jsx';

/* =========================================================
   FACE CAMERA COMPONENT
   
   Props:
   - onCapture: (blob, previewUrl) => void  (called on capture)
   - onCancel: () => void  (optional)
   - autoCapture: boolean (default false) — auto capture on face detect
========================================================= */

export default function FaceCamera({
  onCapture,
  onCancel,
  autoCapture = false,
  buttonLabel = 'Capture',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     START CAMERA
  ========================================================= */

  const startCamera = async () => {
    try {
      setError('');
      setCaptured(null);

      /* Stop existing stream */
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      console.error('camera error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : err.message || 'Failed to access camera'
      );
      setIsReady(false);
    }
  };

  /* =========================================================
     STOP CAMERA
  ========================================================= */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  };

  /* =========================================================
     CAPTURE
  ========================================================= */

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const previewUrl = URL.createObjectURL(blob);
        setCaptured({ blob, previewUrl });
        stopCamera();
      },
      'image/jpeg',
      0.85
    );
  };

  /* =========================================================
     USE CAPTURED
  ========================================================= */

  const useCaptured = async () => {
    if (!captured) return;

    setLoading(true);
    try {
      await onCapture?.(captured.blob, captured.previewUrl);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RETAKE
  ========================================================= */

  const retake = () => {
    if (captured?.previewUrl) {
      URL.revokeObjectURL(captured.previewUrl);
    }
    setCaptured(null);
    startCamera();
  };

  /* =========================================================
     LIFECYCLE
  ========================================================= */

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
      if (captured?.previewUrl) {
        URL.revokeObjectURL(captured.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-4">
      {/* Camera View */}
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border-2 border-gray-200 bg-black">
        <div className="relative aspect-[4/3] w-full">
          {!isReady && !captured && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm">Starting camera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-50 p-4 text-center">
              <AlertCircle size={32} className="text-red-500" />
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="mt-2"
              >
                <RefreshCw size={14} />
                Retry
              </Button>
            </div>
          )}

          {captured ? (
            <img
              src={captured.previewUrl}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                isReady ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transform: 'scaleX(-1)' }}
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Face guide overlay */}
          {isReady && !captured && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-3/4 w-1/2 rounded-full border-2 border-dashed border-white/60" />
            </div>
          )}
        </div>
      </div>

      {/* Status Text */}
      {isReady && !captured && (
        <p className="text-center text-xs text-gray-500">
          Position your face inside the circle
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {captured ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={retake}
              disabled={loading}
            >
              <RefreshCw size={14} />
              Retake
            </Button>

            <Button
              type="button"
              onClick={useCaptured}
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 size={14} />
              {buttonLabel}
            </Button>
          </>
        ) : (
          <>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  stopCamera();
                  onCancel();
                }}
              >
                Cancel
              </Button>
            )}

            <Button
              type="button"
              onClick={capture}
              disabled={!isReady}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera size={14} />
              Capture
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PartyPopper,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
} from 'lucide-react';

import api from '../../api/axios.js';

const CAPTURE_INTERVAL = 3000;
const RESULT_DISPLAY_TIME = 3500;

export default function KioskAttendance() {
  const [searchParams] = useSearchParams();
  const kioskKey = searchParams.get('key');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const resultTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const cameraReadyRef = useRef(false);

  const [kioskInfo, setKioskInfo] = useState(null);
  const [kioskError, setKioskError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentResult, setCurrentResult] = useState(null);
  const [lastScanInfo, setLastScanInfo] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  /* Keep ref in sync with state */
  useEffect(() => {
    cameraReadyRef.current = cameraReady;
  }, [cameraReady]);

  /* =========================================================
     LIVE CLOCK
  ========================================================= */

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* =========================================================
     ONLINE / OFFLINE
  ========================================================= */

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);

    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  /* =========================================================
     VALIDATE KIOSK KEY
  ========================================================= */

  useEffect(() => {
    if (!kioskKey) {
      setKioskError('Kiosk key missing in URL');
      return;
    }

    (async () => {
      try {
        const { data } = await api.get('/kiosk/info', {
          params: { key: kioskKey },
        });

        setKioskInfo(data.data);
      } catch (err) {
        setKioskError(
          err.response?.data?.message ||
            'Invalid or inactive kiosk'
        );
      }
    })();
  }, [kioskKey]);

  /* =========================================================
     BEEP
  ========================================================= */

  const playBeep = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext ||
        window.webkitAudioContext)();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sine';

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(
          1320,
          audioCtx.currentTime + 0.1
        );
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(
          250,
          audioCtx.currentTime + 0.15
        );
      }

      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.35
      );

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn('beep failed:', e);
    }
  };

  /* =========================================================
     VOICE
  ========================================================= */

  const speak = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);

      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 1;

      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('speak failed:', e);
    }
  };

  /* =========================================================
     START CAMERA
  ========================================================= */

  const startCamera = async () => {
    try {
      setCameraError('');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;

        try {
          video.pause();
        } catch {}

        video.srcObject = stream;

        try {
          await video.play();
        } catch (playErr) {
          if (playErr.name !== 'AbortError') {
            console.warn('video play err:', playErr);
          }
        }

        setCameraReady(true);
      }
    } catch (err) {
      console.error('camera err:', err);

      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied'
          : err.message || 'Failed to access camera'
      );

      setCameraReady(false);
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
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  /* =========================================================
     CAPTURE FRAME
  ========================================================= */

  const captureFrame = () => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.95
      );
    });
  };

  /* =========================================================
     SEND TO BACKEND
  ========================================================= */

  const sendFaceCheckIn = async (blob) => {
    if (!blob || !kioskKey) return null;

    try {
      const formData = new FormData();

      formData.append('kioskKey', kioskKey);
      formData.append('image', blob, 'kiosk.jpg');

      const { data } = await api.post(
        '/kiosk/face-check-in',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return data;
    } catch (err) {
      console.error('kiosk check-in err:', err);
      return {
        success: false,
        action: 'error',
        message:
          err.response?.data?.message ||
          'Failed to process face',
      };
    }
  };

  /* =========================================================
     SHOW RESULT
  ========================================================= */

  const showResult = (result) => {
    if (!result) return;

    /* 🆕 IGNORE "no-match" / "no face detected" */
    if (
      result.action === 'no-match' ||
      (result.success === false &&
        result.message &&
        (result.message.toLowerCase().includes('no face') ||
          result.message.toLowerCase().includes('not recognized')))
    ) {
      /* Silently skip — no result screen, keep scanning */
      return;
    }

    setCurrentResult(result);

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (result.success) {
      playBeep('success');
      if (result.data?.employee?.name) {
        speak(`Welcome ${result.data.employee.name}`);
      }
    } else if (result.action === 'already-done') {
      playBeep('error');
    } else if (result.action === 'holiday') {
      playBeep('success');
      speak('Holiday today');
    } else if (result.action === 'weekend') {
      playBeep('error');
    } else {
      playBeep('error');
    }

    if (result.data?.employee?.name) {
      setLastScanInfo({
        name: result.data.employee.name,
        time: new Date(),
      });
    }

    /* 🆕 3.5 sec baad clear + resume */
    resultTimeoutRef.current = setTimeout(async () => {
      setCurrentResult(null);
      resultTimeoutRef.current = null;

      /* 🆕 VIDEO RESUME KARO */
      if (videoRef.current && streamRef.current) {
        try {
          if (videoRef.current.paused) {
            await videoRef.current.play();
          }
          if (!videoRef.current.srcObject) {
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.warn('video resume err:', e);
          }
        }
      }

      /* 🆕 SCAN LOOP RESTART */
      if (cameraReadyRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(
          runScan,
          CAPTURE_INTERVAL
        );
      }
    }, RESULT_DISPLAY_TIME);
  };

  /* =========================================================
     SCAN LOOP
  ========================================================= */

  const runScan = async () => {
    if (isProcessingRef.current) return;
    if (!cameraReadyRef.current) return;
    if (resultTimeoutRef.current) return; /* result showing */

    isProcessingRef.current = true;

    try {
      const blob = await captureFrame();

      if (!blob) {
        isProcessingRef.current = false;
        return;
      }

      const result = await sendFaceCheckIn(blob);

      if (result) {
        showResult(result);
      }
    } catch (err) {
      console.error('scan err:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  /* =========================================================
     AUTO-START
  ========================================================= */

  useEffect(() => {
    if (kioskError) return;
    if (!kioskInfo) return;

    startCamera();

    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resultTimeoutRef.current)
        clearTimeout(resultTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kioskInfo, kioskError]);

  /* =========================================================
     SCAN LOOP STARTER
  ========================================================= */

  useEffect(() => {
    if (!cameraReady) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(
      runScan,
      CAPTURE_INTERVAL
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady]);

  /* =========================================================
     RENDER — ERRORS
  ========================================================= */

  if (kioskError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
          <AlertCircle size={40} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Kiosk Not Available
        </h1>

        <p className="mt-2 max-w-md text-center text-sm text-gray-600">
          {kioskError}
        </p>

        <p className="mt-4 text-xs text-gray-400">
          Please contact your administrator
        </p>
      </div>
    );
  }

  /* =========================================================
     RENDER — LOADING
  ========================================================= */

  if (!kioskInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
        <Loader2 size={40} className="animate-spin text-blue-500" />

        <p className="mt-4 text-sm text-gray-600">
          Starting Kiosk...
        </p>
      </div>
    );
  }

  /* =========================================================
     RENDER — MAIN
  ========================================================= */

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* TOP BAR */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Camera size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold">
              Zwolf Attendance Kiosk
            </h1>

            <p className="text-xs text-white/60">
              {kioskInfo.name} · {kioskInfo.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              online
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            {online ? 'Online' : 'Offline'}
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </p>

            <p className="text-xs text-white/60">
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div className="relative w-full max-w-4xl">

          {/* =================================================
              CAMERA SCREEN — ALWAYS MOUNTED, hidden when result
          ================================================= */}

          <div
            className={`space-y-6 transition-opacity duration-300 ${
              currentResult
                ? 'pointer-events-none absolute inset-0 opacity-0'
                : 'opacity-100'
            }`}
          >
            <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-white/10 bg-black shadow-2xl">
              <div className="relative aspect-[4/3]">
                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-red-950/50 p-6 text-center">
                    <AlertCircle
                      size={40}
                      className="text-red-400"
                    />

                    <p className="text-sm font-semibold text-red-300">
                      {cameraError}
                    </p>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Loading */}
                {!cameraReady && !cameraError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                    <Loader2
                      size={40}
                      className="animate-spin text-blue-400"
                    />

                    <p className="text-sm text-white/70">
                      Starting camera...
                    </p>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover transition-opacity duration-300 ${
                    cameraReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transform: 'scaleX(-1)' }}
                />

                <canvas ref={canvasRef} className="hidden" />

                {/* Face guide overlay */}
                {cameraReady && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-3/4 w-1/2 rounded-full border-4 border-dashed border-white/40" />
                  </div>
                )}

                {/* Corner markers */}
                {cameraReady && (
                  <>
                    <div className="absolute left-4 top-4 h-8 w-8 border-l-4 border-t-4 border-blue-400/70" />
                    <div className="absolute right-4 top-4 h-8 w-8 border-r-4 border-t-4 border-blue-400/70" />
                    <div className="absolute left-4 bottom-4 h-8 w-8 border-l-4 border-b-4 border-blue-400/70" />
                    <div className="absolute right-4 bottom-4 h-8 w-8 border-r-4 border-b-4 border-blue-400/70" />
                  </>
                )}

                {/* Scanning indicator */}
                {cameraReady && (
                  <div className="absolute left-1/2 top-4 -translate-x-1/2">
                    <div className="flex items-center gap-2 rounded-full bg-blue-500/90 px-4 py-1.5 text-xs font-semibold backdrop-blur">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                      Scanning...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                Please look at the camera
              </h2>

              <p className="mt-2 text-sm text-white/60">
                Stand in front of the camera. Face will be
                detected automatically.
              </p>
            </div>

            {/* Last scan */}
            {lastScanInfo && (
              <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Last scan
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {lastScanInfo.name} ·{' '}
                  {lastScanInfo.time.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              RESULT SCREEN — overlay on top
          ================================================= */}

          {currentResult && (
            <div className="relative z-10">
              <ResultScreen result={currentResult} />
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-white/10 px-6 py-3 text-center backdrop-blur">
        <p className="text-xs text-white/40">
          Powered by Zwolf · Attendance System
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   RESULT SCREEN
========================================================= */

function ResultScreen({ result }) {
  const isSuccess = result.success;

  const getIcon = () => {
    if (result.action === 'check-in') return UserCheck;
    if (result.action === 'check-out') return UserCheck;
    if (result.action === 'holiday') return PartyPopper;
    if (result.action === 'weekend') return AlertCircle;
    if (result.action === 'no-match') return UserX;
    if (result.action === 'inactive') return AlertCircle;
    if (result.action === 'already-done') return AlertCircle;
    return isSuccess ? CheckCircle2 : AlertCircle;
  };

  const getColor = () => {
    if (result.action === 'check-in') return 'green';
    if (result.action === 'check-out') return 'blue';
    if (result.action === 'holiday') return 'amber';
    if (result.action === 'no-match') return 'red';
    if (result.action === 'inactive') return 'red';
    if (result.action === 'already-done') return 'orange';
    return isSuccess ? 'green' : 'red';
  };

  const color = getColor();
  const Icon = getIcon();

  const colorMap = {
    green: {
      bg: 'from-green-500/20 to-emerald-500/10',
      ring: 'border-green-400/40',
      icon: 'bg-green-500 text-white',
      title: 'text-green-300',
    },
    blue: {
      bg: 'from-blue-500/20 to-indigo-500/10',
      ring: 'border-blue-400/40',
      icon: 'bg-blue-500 text-white',
      title: 'text-blue-300',
    },
    amber: {
      bg: 'from-amber-500/20 to-orange-500/10',
      ring: 'border-amber-400/40',
      icon: 'bg-amber-500 text-white',
      title: 'text-amber-300',
    },
    orange: {
      bg: 'from-orange-500/20 to-amber-500/10',
      ring: 'border-orange-400/40',
      icon: 'bg-orange-500 text-white',
      title: 'text-orange-300',
    },
    red: {
      bg: 'from-red-500/20 to-rose-500/10',
      ring: 'border-red-400/40',
      icon: 'bg-red-500 text-white',
      title: 'text-red-300',
    },
  };

  const c = colorMap[color] || colorMap.green;

  const timeStr =
    result.data?.attendance?.logoutTime
      ? new Date(result.data.attendance.logoutTime).toLocaleTimeString(
          'en-IN',
          { hour: '2-digit', minute: '2-digit', hour12: true }
        )
      : result.data?.attendance?.loginTime
      ? new Date(result.data.attendance.loginTime).toLocaleTimeString(
          'en-IN',
          { hour: '2-digit', minute: '2-digit', hour12: true }
        )
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br ${c.bg} ${c.ring} p-12 text-center shadow-2xl`}
    >
      <div
        className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full ${c.icon} shadow-2xl`}
      >
        <Icon size={56} strokeWidth={2.5} />
      </div>

      <p
        className={`mt-8 text-sm font-bold uppercase tracking-[0.3em] ${c.title}`}
      >
        {result.action === 'check-in' && 'CHECKED IN'}
        {result.action === 'check-out' && 'CHECKED OUT'}
        {result.action === 'holiday' && 'HOLIDAY'}
        {result.action === 'weekend' && 'WEEKEND'}
        {result.action === 'no-match' && 'NOT RECOGNIZED'}
        {result.action === 'inactive' && 'INACTIVE'}
        {result.action === 'already-done' && 'ALREADY DONE'}
        {result.action === 'error' && 'ERROR'}
      </p>

      {result.data?.employee?.name && (
        <h2 className="mt-4 text-5xl font-bold text-white">
          {result.data.employee.name}
        </h2>
      )}

      <p className="mt-4 text-lg text-white/80">{result.message}</p>

      {timeStr && (
        <p className="mt-3 text-2xl font-semibold text-white/90 tabular-nums">
          {timeStr}
        </p>
      )}

      {result.data?.attendance?.isLate && (
        <p className="mt-3 inline-block rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-semibold text-red-300">
          Late by {result.data.attendance.lateMinutes} min
        </p>
      )}

      {result.data?.confidence && (
        <p className="mt-4 text-xs text-white/50">
          Face match: {result.data.confidence}%
        </p>
      )}
    </div>
  );
}
import { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  UserCircle,
} from 'lucide-react';

import api from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';
import FaceCamera from './FaceCamera.jsx';

/* =========================================================
   FACE CHECK-IN COMPONENT — used inside Attendance page
   
   Props:
   - onSuccess: (data) => void  (called after successful check-in)
========================================================= */

export default function FaceCheckIn({ onSuccess }) {
  const { success, error: toastError } = useToast();

  const [showCamera, setShowCamera] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /* =========================================================
     HANDLE CAPTURE + SEND TO BACKEND
  ========================================================= */

  const handleCapture = async (blob) => {
    if (!blob) return;

    try {
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      const { data } = await api.post(
        '/attendance/face-check-in',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setResult(data.data);
      setShowCamera(false);

      success(data.message || 'Check-in successful');

      onSuccess?.(data.data);
    } catch (err) {
      console.error('face check-in err:', err);
      const msg =
        err.response?.data?.message ||
        'Face recognition failed. Please try again.';
      setError(msg);
      toastError(msg);
    }
  };

  /* =========================================================
     RENDER — when camera is open
  ========================================================= */

  if (showCamera) {
    return (
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Face Check-In
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Look at the camera and capture
          </p>
        </div>

        <div className="p-5">
          <FaceCamera
            onCapture={handleCapture}
            onCancel={() => setShowCamera(false)}
            buttonLabel="Mark Attendance"
          />
        </div>
      </Card>
    );
  }

  /* =========================================================
     RENDER — result or start button
  ========================================================= */

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Face ID Attendance
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          Mark your attendance using face recognition
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Success result */}
        {result && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <CheckCircle2 size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-800">
                  Welcome {result.employee?.name}!
                </p>
                <p className="mt-0.5 text-xs text-green-700">
                  Attendance marked successfully
                  {result.confidence
                    ? ` (${result.confidence}% match)`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Recognition Failed
                </p>
                <p className="mt-0.5 text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Start button */}
        <Button
          onClick={() => {
            setError('');
            setResult(null);
            setShowCamera(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <UserCircle size={16} />
          Start Face Check-In
        </Button>
      </div>
    </Card>
  );
}
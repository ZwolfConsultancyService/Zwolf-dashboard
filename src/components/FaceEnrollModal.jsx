import { useState } from 'react';
import { X, UserCheck } from 'lucide-react';

import api from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from './ui/Modal.jsx';
import FaceCamera from './FaceCamera.jsx';

/* =========================================================
   FACE ENROLL MODAL — Manager uses this to register employee face
   
   Props:
   - employee: { _id, name, role }  (employee object)
   - onClose: () => void
   - onSuccess: () => void  (called after successful registration)
========================================================= */

export default function FaceEnrollModal({
  employee,
  onClose,
  onSuccess,
}) {
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     HANDLE CAPTURE + UPLOAD
  ========================================================= */

  const handleCapture = async (blob) => {
    if (!blob || !employee?._id) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      const { data } = await api.post(
        `/attendance/face/register/${employee._id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      success(
        data?.message || `Face registered for ${employee.name}`
      );

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('face enroll err:', err);
      toastError(
        err.response?.data?.message || 'Failed to register face'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Register Employee Face"
    >
      <div className="space-y-4">
        {/* Employee info */}
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <UserCheck size={20} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {employee?.name || 'Employee'}
            </p>
            <p className="text-xs text-gray-500">
              {employee?.role || ''}
            </p>
          </div>
        </div>

        {/* Camera */}
        <FaceCamera
          onCapture={handleCapture}
          onCancel={onClose}
          buttonLabel="Save Face"
        />

        {submitting && (
          <p className="text-center text-xs text-gray-500">
            Registering face... please wait
          </p>
        )}
      </div>
    </Modal>
  );
}
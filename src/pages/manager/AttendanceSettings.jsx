import { useEffect, useState } from 'react';
import {
  Settings,
  Clock,
  Save,
  UserX,
  Coffee,
  Zap,
  ScanFace,
  Info,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

export default function ManagerAttendanceSettings() {
  const { success, error: toastError } = useToast();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/settings');
      setSettings(data.data);
    } catch (err) {
      toastError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await api.put(
        '/attendance/settings',
        settings
      );
      setSettings(data.data);
      success('Settings saved successfully');
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <form onSubmit={submit} className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Settings size={21} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Attendance Settings
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Configure office timings, cutoffs, and automation
              </p>
            </div>
          </div>

          <Button
            type="submit"
            loading={saving}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Save size={16} />
            Save Settings
          </Button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Info size={15} />
          </div>
          <div className="text-xs text-blue-800">
            <p className="font-semibold">How it works:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>
                Check-in before <strong>12:00 PM</strong> → Present
              </li>
              <li>
                Check-in after <strong>12:00 PM</strong> → Half Day
              </li>
              <li>
                Check-in after <strong>1:00 PM</strong> → Absent
              </li>
              <li>
                Auto logout at <strong>6:00 PM</strong>
              </li>
              <li>
                Auto absent mark at <strong>1:00 PM</strong> for
                no-shows
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* OFFICE TIMINGS */}
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Office Timings
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Standard working hours and break times
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field
            label="Office Start Time"
            value={settings.officeStartTime}
            onChange={(v) => updateField('officeStartTime', v)}
            type="time"
            hint="Employees should check in by this time"
          />
          <Field
            label="Office End Time"
            value={settings.officeEndTime}
            onChange={(v) => updateField('officeEndTime', v)}
            type="time"
            hint="Auto logout happens at this time"
          />
          <Field
            label="Lunch Start"
            value={settings.lunchStartTime}
            onChange={(v) => updateField('lunchStartTime', v)}
            type="time"
          />
          <Field
            label="Lunch End"
            value={settings.lunchEndTime}
            onChange={(v) => updateField('lunchEndTime', v)}
            type="time"
          />
        </div>
      </Card>

      {/* CUTOFF RULES */}
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <UserX size={16} className="text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Cutoff Rules
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Late arrival thresholds for Half Day and Absent
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field
            label="Half Day Cutoff Time"
            value={settings.halfDayCutoffTime}
            onChange={(v) => updateField('halfDayCutoffTime', v)}
            type="time"
            hint="Check-in after this time → Half Day (Default: 12:00)"
          />
          <Field
            label="Absent Cutoff Time"
            value={settings.absentCutoffTime}
            onChange={(v) => updateField('absentCutoffTime', v)}
            type="time"
            hint="Check-in after this time → Absent (Default: 13:00)"
          />
          <Field
            label="Late Grace (minutes)"
            value={settings.lateGraceMinutes}
            onChange={(v) =>
              updateField('lateGraceMinutes', Number(v))
            }
            type="number"
            hint="Grace period after start time (Default: 15)"
          />
          <Field
            label="Half Day Threshold (minutes)"
            value={settings.halfDayMinutes}
            onChange={(v) =>
              updateField('halfDayMinutes', Number(v))
            }
            type="number"
            hint="Minimum working minutes for Present (Default: 240)"
          />
        </div>
      </Card>

      {/* WEEKEND */}
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Coffee size={16} className="text-purple-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Weekend Days
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Select which days are weekend (auto holiday)
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
              (day, idx) => {
                const isSelected = settings.weekendDays?.includes(
                  idx
                );

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const current =
                        settings.weekendDays || [];
                      const updated = isSelected
                        ? current.filter((d) => d !== idx)
                        : [...current, idx];
                      updateField('weekendDays', updated);
                    }}
                    className={`
                      rounded-lg border-2 py-3 text-xs font-semibold transition
                      ${
                        isSelected
                          ? 'border-purple-400 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              }
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Currently selected:{' '}
            <strong>
              {settings.weekendDays?.length
                ? settings.weekendDays
                    .map(
                      (d) =>
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                          d
                        ]
                    )
                    .join(', ')
                : 'None'}
            </strong>
          </p>
        </div>
      </Card>

      {/* AUTOMATION */}
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Automation
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Auto-run rules on schedule
          </p>
        </div>

        <div className="space-y-3 p-5">
          <Toggle
            icon={Clock}
            label="Auto Logout at Office End Time"
            description="Automatically log out employees who forgot to check out"
            checked={settings.autoLogoutEnabled}
            onChange={(v) => updateField('autoLogoutEnabled', v)}
          />

          <Toggle
            icon={UserX}
            label="Auto Mark Absent (1 PM Cutoff)"
            description="Mark employees as absent if they haven't checked in by 1 PM"
            checked={settings.autoAbsentEnabled}
            onChange={(v) => updateField('autoAbsentEnabled', v)}
          />

          <Toggle
            icon={ScanFace}
            label="Face Recognition Enabled"
            description="Allow attendance via face recognition (Kiosk)"
            checked={settings.faceRecognitionEnabled}
            onChange={(v) =>
              updateField('faceRecognitionEnabled', v)
            }
          />
        </div>
      </Card>

      {/* SAVE BOTTOM */}
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={saving}
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Save size={16} />
          Save All Settings
        </Button>
      </div>
    </form>
  );
}

/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({ label, value, onChange, type = 'text', hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
      {hint && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

/* =========================================================
   TOGGLE COMPONENT
========================================================= */

function Toggle({ icon: Icon, label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            checked
              ? 'bg-green-50 text-green-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {label}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </label>
  );
}
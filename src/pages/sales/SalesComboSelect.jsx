import { useEffect, useState, useMemo } from 'react';
import { Lock } from 'lucide-react';
import api from '../../api/axios.js';

/**
 * Reusable dropdown — Category + Location combined
 *
 * Props:
 * - value: string (selected combo key — `${categoryId}_${locationId}`)
 * - onChange: (combo) => void  — combo = { categoryId, locationId, categoryName, locationName }
 * - required: boolean
 * - label: string (optional)
 * - disabled: boolean (optional)
 */
export default function SalesComboSelect({
  value,
  onChange,
  required = false,
  label = 'Category & Location',
  disabled = false,
}) {
  const [combos, setCombos] = useState([]);
  const [myKeys, setMyKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [combosRes, myRes] = await Promise.all([
          api.get('/assignments/all-combos'),
          api.get('/assignments/my'),
        ]);
        setCombos(combosRes.data.data);
        setMyKeys(
          new Set(
            myRes.data.data.map(
              (a) => `${a.category?._id}_${a.location?._id}`
            )
          )
        );
      } catch {}
      finally {
        setLoading(false);
      }
    })();
  }, []);

  // Flatten tree to options
  const options = useMemo(() => {
    const list = [];
    const walk = (cat, loc, path = []) => {
      const fullPath = [...path, loc.name];
      const key = `${cat._id}_${loc._id}`;
      list.push({
        key,
        categoryId: cat._id,
        categoryName: cat.name,
        locationId: loc._id,
        locationName: loc.name,
        display: `${cat.name} → ${fullPath.join(' → ')}`,
        available: loc.available,
        isMine: myKeys.has(key),
        takenBy: loc.takenBy,
      });
      loc.children?.forEach((c) => walk(cat, c, fullPath));
    };
    combos.forEach((cat) => cat.locations.forEach((loc) => walk(cat, loc)));
    return list;
  }, [combos, myKeys]);

  const handleChange = (e) => {
    const selected = options.find((o) => o.key === e.target.value);
    onChange?.(selected || null);
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled || loading}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
      >
        <option value="">
          {loading ? 'Loading combos...' : 'Select Category + Location'}
        </option>
        {options.map((opt) => {
          const disabled = !opt.available;
          let suffix = '';
          if (opt.isMine) suffix = ' ✅ (Your Area)';
          else if (disabled) suffix = ` 🔒 (Taken by ${opt.takenBy?.name})`;

          return (
            <option key={opt.key} value={opt.key} disabled={disabled}>
              {opt.display}
              {suffix}
            </option>
          );
        })}
      </select>
      {value && (() => {
        const sel = options.find((o) => o.key === value);
        if (sel?.isMine) {
          return (
            <p className="mt-1 text-[11px] font-medium text-green-600">
              ✅ Yeh aapka assigned area hai
            </p>
          );
        }
        return null;
      })()}
    </div>
  );
}
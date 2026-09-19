export default function StatCard({ label, value, icon: Icon, color = 'primary', hint }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
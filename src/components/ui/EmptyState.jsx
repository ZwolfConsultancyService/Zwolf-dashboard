import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full text-gray-400">
        <Inbox size={32} />
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
      {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
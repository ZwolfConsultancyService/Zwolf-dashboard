import Button from './Button.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-gray-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={16} /> Prev
        </Button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
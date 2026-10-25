import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

export default function PdfViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-semibold">No PDF URL provided.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* 🆕 Clean Toolbar */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="h-6 w-px bg-slate-300" />
          <span className="text-sm font-semibold text-slate-800">
            Document Viewer
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* 🆕 PDF Body - Full Screen, White Background */}
      <div className="flex-1 overflow-hidden bg-slate-200 relative flex justify-center">
        <div className="w-full max-w-6xl h-full bg-white shadow-lg">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="h-full w-full border-none"
            title="PDF Document"
          />
        </div>
      </div>
    </div>
  );
}
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../../api/axios.js';
import Loader from '../../components/ui/Loader.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;

// Agar parent layout me bottom padding hai aur phir bhi gap dikhe,
// to ye value badha do (e.g. 16 ya 24).
const BOTTOM_BLEED = 0;

export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Client hai ya Manager (URL se)
  const isClient = location.pathname.includes('/client/');

  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [baseWidth, setBaseWidth] = useState(800);
  const [viewHeight, setViewHeight] = useState(null);

  const wrapRef = useRef(null);
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);

  // Fetch proposal (client / manager ke liye alag endpoint)
  useEffect(() => {
    (async () => {
      try {
        const endpoint = isClient
          ? `/client-portal/proposals/${id}`
          : `/proposals/${id}`;

        const { data } = await api.get(endpoint);
        setPdfData(data.data);
      } catch (err) {
        console.error('Failed to load PDF:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isClient]);

  // Back: Client -> client proposals, Manager -> manager proposals
  const handleBack = () => {
    if (isClient) navigate('/client/proposals');
    else navigate('/manager/proposals');
  };

  // Viewer ko screen ke bottom tak fill karao (no white gap)
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      setViewHeight(Math.max(300, window.innerHeight - top + BOTTOM_BLEED));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [loading, pdfData]);

  // Container width -> base page width
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 32;
      setBaseWidth(Math.max(280, Math.min(w, 1000)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, pdfData]);

  // Track current page on scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pageRefs.current.length) return;
    const probe = el.scrollTop + el.clientHeight / 3;
    let active = 1;
    for (let i = 0; i < pageRefs.current.length; i++) {
      const p = pageRefs.current[i];
      if (p && p.offsetTop <= probe) active = i + 1;
    }
    setCurrentPage(active);
  }, []);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goToPage = (n) => {
    const page = Math.min(Math.max(1, n), numPages || 1);
    const el = pageRefs.current[page - 1];
    const container = scrollRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
    }
    setCurrentPage(page);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(pageInput, 10);
    if (Number.isNaN(n)) return setPageInput(String(currentPage));
    goToPage(n);
  };

  const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  const resetZoom = () => setZoom(100);

  if (loading) return <Loader text="Loading Document..." />;

  if (!pdfData || !pdfData.documentPdf) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <FileText size={48} className="text-slate-300 mb-4" />
        <p className="text-lg font-semibold text-slate-700">No PDF Found</p>
        <p className="text-sm text-slate-500 mt-1">
          This proposal doesn't have a document attached.
        </p>
        <button
          onClick={handleBack}
          className="mt-6 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition"
        >
          Back to List
        </button>
      </div>
    );
  }

  const iconBtn =
    'flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition';

  return (
    <div
      ref={wrapRef}
      style={{ height: viewHeight ? `${viewHeight}px` : 'calc(100vh - 80px)' }}
      className="flex flex-col overflow-hidden bg-[#e5e7eb]"
    >
      {/* TOP BAR */}
      <div className="shrink-0 z-10 border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* Left: Back + Project / Client */}
          <div className="flex min-w-0 items-center gap-3 lg:w-1/3">
            <button onClick={handleBack} className={iconBtn} title="Go Back">
              <ArrowLeft size={18} />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold leading-tight text-slate-900">
                  {pdfData.projectName}
                </h1>
             
              </div>
            </div>
          </div>

          {/* Center: Page nav + Zoom */}
          <div className="flex items-center justify-center gap-1 order-3 lg:order-none w-full lg:w-auto">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage <= 1}
              className={iconBtn}
              title="First page"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className={iconBtn}
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <form
              onSubmit={handlePageInputSubmit}
              className="flex items-center gap-1 px-2 text-sm text-slate-500"
            >
              <input
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
                onBlur={() => setPageInput(String(currentPage))}
                className="h-7 w-10 rounded border border-slate-200 text-center text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                inputMode="numeric"
              />
              <span>/ {numPages || '–'}</span>
            </form>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className={iconBtn}
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => goToPage(numPages)}
              disabled={currentPage >= numPages}
              className={iconBtn}
              title="Last page"
            >
              <ChevronsRight size={18} />
            </button>

            <div className="mx-2 h-6 w-px bg-slate-200" />

            <button
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className={iconBtn}
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="w-12 text-center text-sm font-medium text-slate-700">
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className={iconBtn}
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button onClick={resetZoom} className={iconBtn} title="Reset zoom">
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Right: Actions */}
        
        </div>
      </div>

      {/* PDF AREA */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-auto bg-[#e5e7eb]"
      >
        <Document
          file={pdfData.documentPdf}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            pageRefs.current = new Array(numPages).fill(null);
          }}
          loading={
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              Loading PDF...
            </div>
          }
          error={
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-slate-600">
              <p>PDF load nahi ho paaya.</p>
              <button
                onClick={() => window.open(pdfData.documentPdf, '_blank')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Open Original
              </button>
            </div>
          }
        >
          <div className="mx-auto flex w-max flex-col gap-4 px-4 py-4">
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => (pageRefs.current[i] = el)}
                className="bg-white shadow-md"
              >
                <Page
                  pageNumber={i + 1}
                  width={(baseWidth * zoom) / 100}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div
                      style={{
                        width: (baseWidth * zoom) / 100,
                        height: ((baseWidth * zoom) / 100) * 0.5625,
                      }}
                      className="bg-white"
                    />
                  }
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}
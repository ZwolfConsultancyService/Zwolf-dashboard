import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, FileText } from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';

export default function ProposalForm() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Form State (sirf 3 cheezein)
  const [clientId, setClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  // Clients load karo dropdown ke liye
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/clients', { params: { limit: 200 } });
        setClients(data.data || []);
      } catch (err) {
        console.error('Clients load failed', err);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!clientId) return toastError('Please select a client');
    if (!projectName) return toastError('Please enter project name');
    if (!pdfFile) return toastError('Please upload a PDF document');

    setSaving(true);

    try {
      // FormData banayenge taaki file aur fields dono jayein
      const formData = new FormData();
      formData.append('client', clientId);
      formData.append('projectName', projectName);
      formData.append('pdf', pdfFile);

      // Note: Axios khud hi headers handle karta hai, manually Content-Type set nahi karna
      await api.post('/proposals', formData);

      success('Proposal PDF Uploaded successfully');
      navigate('/manager/proposals');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to upload');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/manager/proposals')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} /> Back to Proposals
      </button>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
            <FileText className="text-blue-600" size={18} />
            <h2 className="text-sm font-semibold text-slate-900">
              Upload Client Document (PDF)
            </h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Client Dropdown */}
            <Select
              label="Select Client *"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">-- Choose Client --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientName} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </Select>

            {/* Project Name Input */}
            <Input
              label="Project Name *"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Website Design Proposal"
              required
            />

            {/* PDF File Input */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Upload PDF Document *
              </label>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-blue-500" />
                  <p className="text-sm text-slate-700 font-semibold">
                    {pdfFile ? pdfFile.name : "Click to upload PDF"}
                  </p>
                  <p className="text-xs text-slate-500">Only .pdf files allowed</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
              </label>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  className="mt-2 text-xs font-bold text-red-500 hover:underline"
                >
                  Remove File
                </button>
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/manager/proposals')}
            disabled={saving}
            className="rounded-lg px-5"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={saving}
            className="rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
          >
            <Save size={14} /> Upload PDF
          </Button>
        </div>
      </form>
    </div>
  );
}
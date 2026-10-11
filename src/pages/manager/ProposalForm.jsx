import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Loader from '../../components/ui/Loader.jsx';

export default function ProposalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const isEdit = !!id;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    client: '',
    projectName: '',
    description: '',
    scopeOfWork: [''],
    technologies: [''],
    startDate: '',
    endDate: '',
    totalAmount: '',
    paymentTerms: '50% advance, 50% on delivery',
    termsAndConditions: ['Proposal valid for 30 days'],
    validUntil: '',
  });

  /* LOAD */
  useEffect(() => {
    (async () => {
      try {
        const clientsRes = await api.get('/clients', {
          params: { limit: 200 },
        });
        setClients(clientsRes.data.data || []);

        if (isEdit) {
          const { data } = await api.get(`/proposals/${id}`);
          const p = data.data;
          setForm({
            client: p.client?._id || '',
            projectName: p.projectName || '',
            description: p.description || '',
            scopeOfWork:
              p.scopeOfWork?.length > 0 ? p.scopeOfWork : [''],
            technologies:
              p.technologies?.length > 0 ? p.technologies : [''],
            startDate: p.startDate
              ? new Date(p.startDate).toISOString().slice(0, 10)
              : '',
            endDate: p.endDate
              ? new Date(p.endDate).toISOString().slice(0, 10)
              : '',
            totalAmount: p.totalAmount || '',
            paymentTerms: p.paymentTerms || '',
            termsAndConditions:
              p.termsAndConditions?.length > 0
                ? p.termsAndConditions
                : [''],
            validUntil: p.validUntil
              ? new Date(p.validUntil).toISOString().slice(0, 10)
              : '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateArrayItem = (field, index, value) =>
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });

  const addArrayItem = (field) =>
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }));

  const removeArrayItem = (field, index) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        totalAmount: Number(form.totalAmount) || 0,
        scopeOfWork: form.scopeOfWork.filter((s) => s.trim()),
        technologies: form.technologies.filter((t) => t.trim()),
        termsAndConditions: form.termsAndConditions.filter((t) =>
          t.trim()
        ),
      };

      if (isEdit) {
        await api.put(`/proposals/${id}`, payload);
        success('Proposal updated');
        navigate('/manager/proposals');
      } else {
        const { data } = await api.post('/proposals', payload);
        success('Proposal created');
        navigate(`/manager/proposals/${data.data._id}`);
      }
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading..." />;

  return (
    <div className="space-y-5 pb-8">
      {/* BACK */}
      <button
        onClick={() => navigate('/manager/proposals')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Proposals
      </button>

      <form onSubmit={submit} className="space-y-5">
        {/* BASIC */}
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Basic Information
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Client *"
                value={form.client}
                onChange={(e) =>
                  updateField('client', e.target.value)
                }
                required
                disabled={isEdit}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName}
                    {c.companyName
                      ? ` (${c.companyName})`
                      : ''}
                  </option>
                ))}
              </Select>

              <Input
                label="Project Name *"
                value={form.projectName}
                onChange={(e) =>
                  updateField('projectName', e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  updateField('description', e.target.value)
                }
                placeholder="Project description..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </Card>

        {/* SCOPE */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Scope of Work
            </h2>
            <button
              type="button"
              onClick={() => addArrayItem('scopeOfWork')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2 p-5">
            {form.scopeOfWork.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    updateArrayItem(
                      'scopeOfWork',
                      i,
                      e.target.value
                    )
                  }
                  placeholder="e.g. Product catalog"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                {form.scopeOfWork.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeArrayItem('scopeOfWork', i)
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* TECHNOLOGIES */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Technologies
            </h2>
            <button
              type="button"
              onClick={() => addArrayItem('technologies')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2 p-5">
            {form.technologies.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    updateArrayItem(
                      'technologies',
                      i,
                      e.target.value
                    )
                  }
                  placeholder="e.g. React, Node.js"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                {form.technologies.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeArrayItem('technologies', i)
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* TIMELINE + PRICING */}
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Timeline & Pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                updateField('startDate', e.target.value)
              }
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                updateField('endDate', e.target.value)
              }
            />
            <Input
              label="Total Amount (₹) *"
              type="number"
              min="0"
              value={form.totalAmount}
              onChange={(e) =>
                updateField('totalAmount', e.target.value)
              }
              required
            />
            <Input
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) =>
                updateField('validUntil', e.target.value)
              }
            />
            <div className="sm:col-span-2">
              <Input
                label="Payment Terms"
                value={form.paymentTerms}
                onChange={(e) =>
                  updateField('paymentTerms', e.target.value)
                }
              />
            </div>
          </div>
        </Card>

        {/* T&C */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Terms & Conditions
            </h2>
            <button
              type="button"
              onClick={() =>
                addArrayItem('termsAndConditions')
              }
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2 p-5">
            {form.termsAndConditions.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    updateArrayItem(
                      'termsAndConditions',
                      i,
                      e.target.value
                    )
                  }
                  placeholder="e.g. Proposal valid for 30 days"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                {form.termsAndConditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeArrayItem(
                        'termsAndConditions',
                        i
                      )
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ACTIONS */}
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
            <Save size={14} />
            {isEdit ? 'Update Proposal' : 'Create Proposal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
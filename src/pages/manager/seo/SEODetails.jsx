import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import {
  getSEOById,
  addMonthlyTracking,
  updateMonthlyTracking,
  deleteMonthlyTracking,
} from "../../../services/seoService";

const SEODetails = ({
  seoId,
  onBack,
}) => {
  const [seo, setSeo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const loadSEO = async () => {
    try {
      setLoading(true);

      const response =
        await getSEOById(seoId);

      setSeo(
        response?.data ||
          response?.seo ||
          response
      );
    } catch (error) {
      console.error(
        "Failed to load SEO:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSEO();
  }, [seoId]);

  const handleDelete = async (
    trackingId
  ) => {
    const confirmed =
      window.confirm(
        "Delete this monthly tracking?"
      );

    if (!confirmed) return;

    try {
      await deleteMonthlyTracking(
        seoId,
        trackingId
      );

      await loadSEO();
    } catch (error) {
      console.error(
        "Delete tracking failed:",
        error
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!seo) {
    return (
      <div className="p-6">
        SEO record not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to SEO
        </button>

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                SEO Client
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {seo.client
                  ?.clientName ||
                  "Client"}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {seo.client
                  ?.companyName ||
                  seo.client?.email ||
                  "-"}
              </p>
            </div>

            <div className="lg:text-right">
              <p className="text-lg font-bold text-slate-900">
                {seo.planName}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                ₹
                {Number(
                  seo.amount || 0
                ).toLocaleString(
                  "en-IN"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Start Date"
            value={formatDate(
              seo.startDate
            )}
          />

          <Info
            label="End Date"
            value={formatDate(
              seo.endDate
            )}
          />

          <Info
            label="Duration"
            value={`${seo.durationInDays} Days`}
          />

          <Info
            label="Status"
            value={seo.status}
          />
        </div>

        {/* MONTHLY TRACKING */}
     <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">

  {/* HEADER */}
  <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
    <div>
      <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
        Monthly SEO Tracking
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Track SEO work month by month.
      </p>
    </div>

    <button
      onClick={() => {
        setEditing(null);
        setShowModal(true);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.98]"
    >
      <Plus size={16} />
      Add Month
    </button>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">
    <table className="w-full min-w-[1100px]">

      {/* TABLE HEAD */}
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Month
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Keywords
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Backlinks
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Blogs
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            On Page
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Technical
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Ranking
          </th>

          <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Work
          </th>

          <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Actions
          </th>
        </tr>
      </thead>

      {/* TABLE BODY */}
      <tbody className="divide-y divide-slate-100">

        {!seo.monthlyTracking?.length ? (
          <tr>
            <td
              colSpan="9"
              className="px-5 py-16 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                <CheckCircle2 size={22} />
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                No monthly tracking
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add the first month's SEO progress.
              </p>
            </td>
          </tr>
        ) : (
          seo.monthlyTracking.map(
            (item) => (
              <tr
                key={item._id}
                className="group transition-colors duration-150 hover:bg-slate-50/70"
              >

                {/* MONTH */}
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.month}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.year}
                    </p>
                  </div>
                </td>

                {/* KEYWORDS */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-slate-700">
                    {item.keywordsCompleted}
                  </span>

                  <span className="mx-1 text-slate-300">
                    /
                  </span>

                  <span className="text-sm text-slate-500">
                    {item.keywordsTarget}
                  </span>
                </td>

                {/* BACKLINKS */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-slate-700">
                    {item.backlinksCompleted}
                  </span>

                  <span className="mx-1 text-slate-300">
                    /
                  </span>

                  <span className="text-sm text-slate-500">
                    {item.backlinksTarget}
                  </span>
                </td>

                {/* BLOGS */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-slate-700">
                    {item.blogsCompleted}
                  </span>

                  <span className="mx-1 text-slate-300">
                    /
                  </span>

                  <span className="text-sm text-slate-500">
                    {item.blogsTarget}
                  </span>
                </td>

                {/* ON PAGE */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-slate-700">
                    {item.onPageCompleted}
                  </span>

                  <span className="mx-1 text-slate-300">
                    /
                  </span>

                  <span className="text-sm text-slate-500">
                    {item.onPageTarget}
                  </span>
                </td>

                {/* TECHNICAL */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-slate-700">
                    {item.technicalCompleted}
                  </span>

                  <span className="mx-1 text-slate-300">
                    /
                  </span>

                  <span className="text-sm text-slate-500">
                    {item.technicalTarget}
                  </span>
                </td>

                {/* RANKING */}
                <td className="px-5 py-4">
                  <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                    {item.rankingImproved}
                  </span>
                </td>

                {/* WORK */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
                    {item.workStatus}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() => {
                        setEditing(item);
                        setShowModal(true);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(item._id)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                    >
                      <Trash2 size={14} />
                    </button>

                  </div>
                </td>

              </tr>
            )
          )
        )}

      </tbody>
    </table>
  </div>
</div>
      </div>

      {showModal && (
        <TrackingModal
          seoId={seoId}
          tracking={editing}
          onClose={() =>
            setShowModal(false)
          }
          onSuccess={() => {
            setShowModal(false);
            loadSEO();
          }}
        />
      )}
    </div>
  );
};

const Info = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-medium text-slate-400">
      {label}
    </p>

    <p className="mt-1 text-sm font-bold capitalize text-slate-800">
      {value}
    </p>
  </div>
);

const formatDate = (
  date
) => {
  if (!date) return "-";

  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const TrackingModal = ({
  seoId,
  tracking,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] =
    useState({
      month:
        tracking?.month || "",
      year:
        tracking?.year ||
        new Date().getFullYear(),

      keywordsTarget:
        tracking?.keywordsTarget ||
        0,

      keywordsCompleted:
        tracking?.keywordsCompleted ||
        0,

      backlinksTarget:
        tracking?.backlinksTarget ||
        0,

      backlinksCompleted:
        tracking?.backlinksCompleted ||
        0,

      blogsTarget:
        tracking?.blogsTarget ||
        0,

      blogsCompleted:
        tracking?.blogsCompleted ||
        0,

      onPageTarget:
        tracking?.onPageTarget ||
        0,

      onPageCompleted:
        tracking?.onPageCompleted ||
        0,

      technicalTarget:
        tracking?.technicalTarget ||
        0,

      technicalCompleted:
        tracking?.technicalCompleted ||
        0,

      rankingImproved:
        tracking?.rankingImproved ||
        0,

      paymentAmount:
        tracking?.paymentAmount ||
        0,

      paymentStatus:
        tracking?.paymentStatus ||
        "pending",

      workStatus:
        tracking?.workStatus ||
        "pending",

      notes:
        tracking?.notes || "",
    });

  const [saving, setSaving] =
    useState(false);

  const update = (
    key,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setSaving(true);

      const numericFields = [
        "year",
        "keywordsTarget",
        "keywordsCompleted",
        "backlinksTarget",
        "backlinksCompleted",
        "blogsTarget",
        "blogsCompleted",
        "onPageTarget",
        "onPageCompleted",
        "technicalTarget",
        "technicalCompleted",
        "rankingImproved",
        "paymentAmount",
      ];

      const payload = {
        ...form,
      };

      numericFields.forEach(
        (field) => {
          payload[field] =
            Number(
              payload[field] || 0
            );
        }
      );

      if (tracking) {
        await updateMonthlyTracking(
          seoId,
          tracking._id,
          payload
        );
      } else {
        await addMonthlyTracking(
          seoId,
          payload
        );
      }

      onSuccess();
    } catch (error) {
      console.error(
        "Tracking save failed:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save monthly tracking"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="font-bold text-slate-900">
            {tracking
              ? "Update Monthly Tracking"
              : "Add Monthly Tracking"}
          </h2>

          <button
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={submit}
          className="space-y-6 p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Month"
              value={form.month}
              onChange={(e) =>
                update(
                  "month",
                  e.target.value
                )
              }
              placeholder="October"
              required
            />

            <Field
              label="Year"
              type="number"
              value={form.year}
              onChange={(e) =>
                update(
                  "year",
                  e.target.value
                )
              }
              required
            />
          </div>

          <Section title="Keywords">
            <Field
              label="Target"
              type="number"
              value={
                form.keywordsTarget
              }
              onChange={(e) =>
                update(
                  "keywordsTarget",
                  e.target.value
                )
              }
            />

            <Field
              label="Completed"
              type="number"
              value={
                form.keywordsCompleted
              }
              onChange={(e) =>
                update(
                  "keywordsCompleted",
                  e.target.value
                )
              }
            />
          </Section>

          <Section title="Backlinks">
            <Field
              label="Target"
              type="number"
              value={
                form.backlinksTarget
              }
              onChange={(e) =>
                update(
                  "backlinksTarget",
                  e.target.value
                )
              }
            />

            <Field
              label="Completed"
              type="number"
              value={
                form.backlinksCompleted
              }
              onChange={(e) =>
                update(
                  "backlinksCompleted",
                  e.target.value
                )
              }
            />
          </Section>

          <Section title="Blogs">
            <Field
              label="Target"
              type="number"
              value={
                form.blogsTarget
              }
              onChange={(e) =>
                update(
                  "blogsTarget",
                  e.target.value
                )
              }
            />

            <Field
              label="Completed"
              type="number"
              value={
                form.blogsCompleted
              }
              onChange={(e) =>
                update(
                  "blogsCompleted",
                  e.target.value
                )
              }
            />
          </Section>

          <Section title="On Page SEO">
            <Field
              label="Target"
              type="number"
              value={
                form.onPageTarget
              }
              onChange={(e) =>
                update(
                  "onPageTarget",
                  e.target.value
                )
              }
            />

            <Field
              label="Completed"
              type="number"
              value={
                form.onPageCompleted
              }
              onChange={(e) =>
                update(
                  "onPageCompleted",
                  e.target.value
                )
              }
            />
          </Section>

          <Section title="Technical SEO">
            <Field
              label="Target"
              type="number"
              value={
                form.technicalTarget
              }
              onChange={(e) =>
                update(
                  "technicalTarget",
                  e.target.value
                )
              }
            />

            <Field
              label="Completed"
              type="number"
              value={
                form.technicalCompleted
              }
              onChange={(e) =>
                update(
                  "technicalCompleted",
                  e.target.value
                )
              }
            />
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Ranking Improved"
              type="number"
              value={
                form.rankingImproved
              }
              onChange={(e) =>
                update(
                  "rankingImproved",
                  e.target.value
                )
              }
            />

            <Field
              label="Payment Amount"
              type="number"
              value={
                form.paymentAmount
              }
              onChange={(e) =>
                update(
                  "paymentAmount",
                  e.target.value
                )
              }
            />

            <Select
              label="Payment Status"
              value={
                form.paymentStatus
              }
              onChange={(e) =>
                update(
                  "paymentStatus",
                  e.target.value
                )
              }
            >
              <option value="pending">
                Pending
              </option>
              <option value="partial">
                Partial
              </option>
              <option value="paid">
                Paid
              </option>
            </Select>

            <Select
              label="Work Status"
              value={
                form.workStatus
              }
              onChange={(e) =>
                update(
                  "workStatus",
                  e.target.value
                )
              }
            >
              <option value="pending">
                Pending
              </option>
              <option value="in-progress">
                In Progress
              </option>
              <option value="completed">
                Completed
              </option>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Notes
            </label>

            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) =>
                update(
                  "notes",
                  e.target.value
                )
              }
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Add monthly SEO notes..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : tracking
                ? "Update Tracking"
                : "Add Tracking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
}) => (
  <div>
    <h3 className="mb-3 text-sm font-bold text-slate-800">
      {title}
    </h3>

    <div className="grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  </div>
);

const Field = ({
  label,
  ...props
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </label>

    <input
      {...props}
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

const Select = ({
  label,
  children,
  ...props
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </label>

    <select
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      {children}
    </select>
  </div>
);

export default SEODetails;
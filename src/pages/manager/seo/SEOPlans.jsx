import React, {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Pencil,
  Power,
  Search,
  X,
} from "lucide-react";

import {
  getSEOPlans,
  createSEOPlan,
  updateSEOPlan,
  toggleSEOPlan,
} from "../../../services/seoService";

const emptyForm = {
  name: "",
  durationInDays: "",
  price: "",
  description: "",
  keywords: 0,
  backlinks: 0,
  blogs: 0,
  onPageSEO: 0,
  technicalSEO: 0,
  localSEO: false,
};

const SEOPlans = () => {
  const [plans, setPlans] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [modal, setModal] =
    useState(false);

  const [editingPlan, setEditingPlan] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const loadPlans = async () => {
    try {
      setLoading(true);

      const response =
        await getSEOPlans();

      setPlans(
        response?.data ||
          response?.plans ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to load SEO plans:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans =
    plans.filter((plan) =>
      plan.name
        ?.toLowerCase()
        .includes(
          search
            .toLowerCase()
            .trim()
        )
    );

  const openCreate = () => {
    setEditingPlan(null);
    setModal(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setModal(true);
  };

  const handleToggle = async (
    id
  ) => {
    try {
      await toggleSEOPlan(id);
      await loadPlans();
    } catch (error) {
      console.error(
        "Failed to toggle plan:",
        error
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              SEO Plans
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage SEO service packages.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Create SEO Plan
          </button>
        </div>

        <div className="mb-5">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map(
              (plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  onEdit={() =>
                    openEdit(plan)
                  }
                  onToggle={() =>
                    handleToggle(
                      plan._id
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {modal && (
        <PlanModal
          plan={editingPlan}
          onClose={() =>
            setModal(false)
          }
          onSuccess={() => {
            setModal(false);
            loadPlans();
          }}
        />
      )}
    </div>
  );
};

const PlanCard = ({
  plan,
  onEdit,
  onToggle,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {plan.name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {plan.durationInDays} days
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              plan.isActive
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {plan.isActive
              ? "Active"
              : "Inactive"}
          </span>
        </div>

        <div className="mt-5">
          <span className="text-3xl font-bold text-slate-900">
            ₹
            {Number(
              plan.price || 0
            ).toLocaleString(
              "en-IN"
            )}
          </span>
        </div>

        {plan.description && (
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {plan.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100">
        <Feature
          label="Keywords"
          value={plan.keywords}
        />

        <Feature
          label="Backlinks"
          value={plan.backlinks}
        />

        <Feature
          label="Blogs"
          value={plan.blogs}
        />

        <Feature
          label="On Page"
          value={plan.onPageSEO}
        />

        <Feature
          label="Technical"
          value={plan.technicalSEO}
        />

        <Feature
          label="Local SEO"
          value={
            plan.localSEO
              ? "Yes"
              : "No"
          }
        />
      </div>

      <div className="flex gap-2 p-4">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Pencil size={15} />
          Edit
        </button>

        <button
          onClick={onToggle}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${
            plan.isActive
              ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Power size={15} />

          {plan.isActive
            ? "Disable"
            : "Enable"}
        </button>
      </div>
    </div>
  );
};

const Feature = ({
  label,
  value,
}) => (
  <div className="bg-white px-4 py-3">
    <p className="text-xs text-slate-400">
      {label}
    </p>

    <p className="mt-1 text-sm font-bold text-slate-700">
      {value ?? 0}
    </p>
  </div>
);

const PlanModal = ({
  plan,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] =
    useState(
      plan
        ? {
            name:
              plan.name || "",
            durationInDays:
              plan.durationInDays ||
              "",
            price:
              plan.price || "",
            description:
              plan.description ||
              "",
            keywords:
              plan.keywords || 0,
            backlinks:
              plan.backlinks || 0,
            blogs:
              plan.blogs || 0,
            onPageSEO:
              plan.onPageSEO || 0,
            technicalSEO:
              plan.technicalSEO || 0,
            localSEO:
              plan.localSEO ||
              false,
          }
        : emptyForm
    );

  const [saving, setSaving] =
    useState(false);

  const update = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
        durationInDays:
          Number(
            form.durationInDays
          ),
        price: Number(
          form.price
        ),
        keywords: Number(
          form.keywords
        ),
        backlinks: Number(
          form.backlinks
        ),
        blogs: Number(
          form.blogs
        ),
        onPageSEO: Number(
          form.onPageSEO
        ),
        technicalSEO: Number(
          form.technicalSEO
        ),
      };

      if (plan) {
        await updateSEOPlan(
          plan._id,
          payload
        );
      } else {
        await createSEOPlan(
          payload
        );
      }

      onSuccess();
    } catch (error) {
      console.error(
        "Failed to save SEO plan:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save SEO plan"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              {plan
                ? "Edit SEO Plan"
                : "Create SEO Plan"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Configure SEO deliverables.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Plan Name"
              required
              value={form.name}
              onChange={(e) =>
                update(
                  "name",
                  e.target.value
                )
              }
            />

            <Input
              label="Duration (Days)"
              type="number"
              required
              value={
                form.durationInDays
              }
              onChange={(e) =>
                update(
                  "durationInDays",
                  e.target.value
                )
              }
            />

            <Input
              label="Price"
              type="number"
              required
              value={form.price}
              onChange={(e) =>
                update(
                  "price",
                  e.target.value
                )
              }
            />

            <Input
              label="Keywords"
              type="number"
              value={form.keywords}
              onChange={(e) =>
                update(
                  "keywords",
                  e.target.value
                )
              }
            />

            <Input
              label="Backlinks"
              type="number"
              value={
                form.backlinks
              }
              onChange={(e) =>
                update(
                  "backlinks",
                  e.target.value
                )
              }
            />

            <Input
              label="Blogs"
              type="number"
              value={form.blogs}
              onChange={(e) =>
                update(
                  "blogs",
                  e.target.value
                )
              }
            />

            <Input
              label="On Page SEO"
              type="number"
              value={
                form.onPageSEO
              }
              onChange={(e) =>
                update(
                  "onPageSEO",
                  e.target.value
                )
              }
            />

            <Input
              label="Technical SEO"
              type="number"
              value={
                form.technicalSEO
              }
              onChange={(e) =>
                update(
                  "technicalSEO",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              rows="3"
              value={
                form.description
              }
              onChange={(e) =>
                update(
                  "description",
                  e.target.value
                )
              }
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe the SEO package..."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={
                form.localSEO
              }
              onChange={(e) =>
                update(
                  "localSEO",
                  e.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Local SEO
              </p>

              <p className="text-xs text-slate-500">
                Include local SEO activities in this plan.
              </p>
            </div>
          </label>

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
                : plan
                ? "Update Plan"
                : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Input = ({
  label,
  ...props
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </label>

    <input
      {...props}
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

export default SEOPlans;
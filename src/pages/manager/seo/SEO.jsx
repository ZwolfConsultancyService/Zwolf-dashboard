import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Search,
    Plus,
    Eye,
    CalendarDays,
    CheckCircle2,
    Clock3,
    XCircle,
    Users,
    IndianRupee,
    RefreshCw,
    Pencil,
    Trash2,
    Target,
    Activity,
} from "lucide-react";

import api from "../../../api/axios.js";

import {
    getAllSEO,
    getSEOPlans,
    assignSEO,
    getSEOById,
    updateSEOStatus,
    deleteSEO,

    // MONTHLY
    addMonthlyTracking,
    updateMonthlyTracking,
    deleteMonthlyTracking,

    // DAILY
    addDailyTracking,
    updateDailyTracking,
    deleteDailyTracking,
} from "../../../services/seoService";


/* ======================================================
   MAIN SEO PAGE
====================================================== */

const SEO = () => {
    const [seoList, setSeoList] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingSEO, setDeletingSEO] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [showAssign, setShowAssign] = useState(false);

    const [selectedSEO, setSelectedSEO] = useState(null);


    /* ======================================================
       FETCH SEO
    ====================================================== */

    const fetchSEO = async () => {
        try {
            setRefreshing(true);

            const response = await getAllSEO();

            console.log("SEO API RESPONSE:", response);

            const data =
                response?.data?.records ||
                response?.data?.seo ||
                response?.data?.data ||
                response?.data ||
                response?.records ||
                response?.seo ||
                [];

            setSeoList(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Failed to fetch SEO:",
                error
            );

            setSeoList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        fetchSEO();
    }, []);


    /* ======================================================
       FILTER
    ====================================================== */

    const filteredSEO = useMemo(() => {
        const searchText =
            search.toLowerCase().trim();

        return seoList.filter((seo) => {
            const clientName =
                seo?.client?.clientName || "";

            const companyName =
                seo?.client?.companyName || "";

            const clientEmail =
                seo?.client?.email || "";

            const planName =
                seo?.planName ||
                seo?.plan?.name ||
                "";

            const matchesSearch =
                !searchText ||
                clientName
                    .toLowerCase()
                    .includes(searchText) ||
                companyName
                    .toLowerCase()
                    .includes(searchText) ||
                clientEmail
                    .toLowerCase()
                    .includes(searchText) ||
                planName
                    .toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                statusFilter === "all" ||
                seo.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        seoList,
        search,
        statusFilter,
    ]);


    /* ======================================================
       STATS
    ====================================================== */

    const stats = useMemo(() => {
        const active =
            seoList.filter(
                (item) =>
                    item.status === "active"
            ).length;

        const expired =
            seoList.filter(
                (item) =>
                    item.status === "expired"
            ).length;

        const cancelled =
            seoList.filter(
                (item) =>
                    item.status === "cancelled"
            ).length;

        const revenue =
            seoList.reduce(
                (total, item) =>
                    total +
                    Number(item.amount || 0),
                0
            );

        const expiring =
            seoList.filter((item) => {
                if (
                    item.status !== "active" ||
                    !item.endDate
                ) {
                    return false;
                }

                const endDate =
                    new Date(item.endDate);

                const today = new Date();

                const diff = Math.ceil(
                    (endDate - today) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                    diff >= 0 &&
                    diff <= 30
                );
            }).length;

        return {
            total: seoList.length,
            active,
            expired,
            cancelled,
            revenue,
            expiring,
        };
    }, [seoList]);


    /* ======================================================
       STATUS CHANGE
    ====================================================== */

    const handleStatusChange = async (
        id,
        status
    ) => {
        try {
            await updateSEOStatus(
                id,
                status
            );

            await fetchSEO();
        } catch (error) {
            console.error(
                "Status update failed:",
                error
            );

            alert(
                error?.response?.data?.message ||
                "Failed to update SEO status"
            );
        }
    };


    /* ======================================================
       DELETE SEO
    ====================================================== */

    const handleDeleteSEO = async (id) => {
        const seo = seoList.find(
            (item) =>
                String(item._id) === String(id)
        );

        const clientName =
            seo?.client?.clientName ||
            "this client";

        const confirmed = window.confirm(
            `Are you sure you want to delete the SEO record for ${clientName}?\n\nThis will permanently delete the SEO record, monthly tracking and daily tracking data.\n\nThe client itself will NOT be deleted.`
        );

        if (!confirmed) return;

        try {
            setDeletingSEO(true);

            await deleteSEO(id);

            setSeoList((prev) =>
                prev.filter(
                    (item) =>
                        String(item._id) !== String(id)
                )
            );

            if (
                selectedSEO &&
                String(selectedSEO._id) === String(id)
            ) {
                setSelectedSEO(null);
            }

            alert(
                "SEO record deleted successfully."
            );
        } catch (error) {
            console.error(
                "Delete SEO error:",
                error
            );

            alert(
                error?.response?.data?.message ||
                "Failed to delete SEO record"
            );
        } finally {
            setDeletingSEO(false);
        }
    };


    /* ======================================================
       HELPERS
    ====================================================== */

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    const formatAmount = (amount) => {
        return `₹${Number(
            amount || 0
        ).toLocaleString("en-IN")}`;
    };


    const getDaysRemaining = (
        endDate
    ) => {
        if (!endDate) return null;

        const end =
            new Date(endDate);

        const today = new Date();

        if (
            Number.isNaN(
                end.getTime()
            )
        ) {
            return null;
        }

        return Math.ceil(
            (end - today) /
            (1000 * 60 * 60 * 24)
        );
    };


    const statusBadge = (status) => {
        if (status === "active") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <CheckCircle2 size={13} />
                    Active
                </span>
            );
        }

        if (status === "expired") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    <XCircle size={13} />
                    Expired
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                <XCircle size={13} />
                Cancelled
            </span>
        );
    };


    /* ======================================================
       UI
    ====================================================== */

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-[1600px]">

                {/* HEADER */}

                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            SEO Management
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage SEO plans, client assignments, daily work and monthly progress.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">

                        <button
                            onClick={fetchSEO}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            Refresh
                        </button>

                        <button
                            onClick={() =>
                                setShowAssign(true)
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <Plus size={17} />

                            Assign SEO
                        </button>

                    </div>
                </div>


                {/* STATS */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

                    <StatCard
                        title="Total SEO"
                        value={stats.total}
                        icon={Users}
                    />

                    <StatCard
                        title="Active"
                        value={stats.active}
                        icon={CheckCircle2}
                    />

                    <StatCard
                        title="Expiring Soon"
                        value={stats.expiring}
                        icon={Clock3}
                    />

                    <StatCard
                        title="Expired"
                        value={stats.expired}
                        icon={XCircle}
                    />

                    <StatCard
                        title="Total Value"
                        value={formatAmount(
                            stats.revenue
                        )}
                        icon={IndianRupee}
                    />

                </div>


                {/* TABLE */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* FILTER BAR */}

                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="relative w-full lg:max-w-md">

                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Search client or SEO plan..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="all">
                                All Status
                            </option>

                            <option value="active">
                                Active
                            </option>

                            <option value="expired">
                                Expired
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>
                        </select>

                    </div>


                    {/* TABLE */}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1150px]">

                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Client
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        SEO Plan
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Start Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        End Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Amount
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Payment
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                                            <p className="mt-3 text-sm text-slate-500">
                                                Loading SEO records...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredSEO.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <Search size={22} />
                                            </div>

                                            <p className="mt-3 font-semibold text-slate-800">
                                                No SEO records found
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Assign an SEO plan to a client to get started.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSEO.map((seo) => {

                                        const days =
                                            getDaysRemaining(
                                                seo.endDate
                                            );

                                        /* -----------------------------------------
                                           COMPLETE SEO PLAN PAYMENT
                                        ----------------------------------------- */

                                        const totalPlanAmount = Number(
                                            seo.amount || 0
                                        );

                                        const totalPaidAmount =
                                            seo.monthlyTracking?.reduce(
                                                (total, item) => {
                                                    return (
                                                        total +
                                                        Number(item.paidAmount || 0)
                                                    );
                                                },
                                                0
                                            ) || 0;

                                        const paidAmount = Math.min(
                                            totalPaidAmount,
                                            totalPlanAmount
                                        );

                                        const remainingAmount = Math.max(
                                            totalPlanAmount - paidAmount,
                                            0
                                        );

                                        const paymentStatus =
                                            totalPlanAmount <= 0
                                                ? "pending"
                                                : paidAmount >= totalPlanAmount
                                                    ? "paid"
                                                    : paidAmount > 0
                                                        ? "partial"
                                                        : "pending";

                                        return (
                                            <tr
                                                key={seo._id}
                                                className="border-b border-slate-100 transition hover:bg-slate-50/70"
                                            >

                                                {/* CLIENT */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {seo.client?.clientName ||
                                                                "Unknown Client"}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            {seo.client?.companyName ||
                                                                seo.client?.email ||
                                                                "-"}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* SEO PLAN */}
                                                <td className="px-5 py-4">

                                                    <p className="font-semibold text-slate-800">
                                                        {seo.planName ||
                                                            seo.plan?.name ||
                                                            "-"}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {seo.durationInDays || 0} days
                                                    </p>

                                                </td>

                                                {/* START DATE */}
                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {formatDate(
                                                        seo.startDate
                                                    )}
                                                </td>

                                                {/* END DATE */}
                                                <td className="px-5 py-4">

                                                    <p className="text-sm font-medium text-slate-700">
                                                        {formatDate(
                                                            seo.endDate
                                                        )}
                                                    </p>

                                                    {seo.status === "active" &&
                                                        days !== null && (
                                                            <p
                                                                className={`mt-0.5 text-xs font-medium ${days <= 30
                                                                    ? "text-orange-600"
                                                                    : "text-slate-400"
                                                                    }`}
                                                            >
                                                                {days >= 0
                                                                    ? `${days} days remaining`
                                                                    : "Expired"}
                                                            </p>
                                                        )}

                                                </td>

                                                {/* TOTAL PLAN AMOUNT */}
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {formatAmount(
                                                            totalPlanAmount
                                                        )}
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        Full plan amount
                                                    </p>
                                                </td>

                                                {/* PAYMENT */}
                                                <td className="px-5 py-4">

                                                    <div className="min-w-[165px]">

                                                        {/* PAYMENT STATUS */}
                                                        <div className="flex items-center justify-between gap-3">

                                                            <span className="text-[11px] font-medium text-slate-400">
                                                                Payment
                                                            </span>

                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${paymentStatus === "paid"
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : paymentStatus === "partial"
                                                                        ? "bg-amber-50 text-amber-700"
                                                                        : "bg-red-50 text-red-600"
                                                                    }`}
                                                            >
                                                                {paymentStatus === "paid"
                                                                    ? "Paid"
                                                                    : paymentStatus === "partial"
                                                                        ? "Partially Paid"
                                                                        : "Unpaid"}
                                                            </span>

                                                        </div>

                                                        {/* PAYMENT SUMMARY */}
                                                        <div className="mt-2 space-y-1">

                                                            <p className="text-xs text-slate-500">
                                                                Paid:{" "}
                                                                <span className="font-semibold text-emerald-600">
                                                                    {formatAmount(
                                                                        paidAmount
                                                                    )}
                                                                </span>
                                                            </p>

                                                            <p
                                                                className={`text-xs ${remainingAmount > 0
                                                                    ? "text-orange-600"
                                                                    : "text-emerald-600"
                                                                    }`}
                                                            >
                                                                Due:{" "}
                                                                <span className="font-semibold">
                                                                    {formatAmount(
                                                                        remainingAmount
                                                                    )}
                                                                </span>
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* SEO STATUS */}
                                                <td className="px-5 py-4">
                                                    {statusBadge(
                                                        seo.status
                                                    )}
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="px-5 py-4">

                                                    <div className="flex justify-end gap-2">

                                                        <button
                                                            onClick={() =>
                                                                setSelectedSEO(
                                                                    seo
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                            title="View SEO"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {seo.status === "active" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        seo._id,
                                                                        "cancelled"
                                                                    )
                                                                }
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                                title="Cancel SEO"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() =>
                                                                handleDeleteSEO(
                                                                    seo._id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingSEO
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                            title="Delete SEO"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    })
                                )}

                            </tbody>
                        </table>

                    </div>

                </div>

            </div>


            {/* ASSIGN MODAL */}

            {showAssign && (
                <AssignSEOModal
                    onClose={() =>
                        setShowAssign(false)
                    }
                    onSuccess={() => {
                        setShowAssign(false);
                        fetchSEO();
                    }}
                />
            )}


            {/* DETAILS */}

            {selectedSEO && (
                <SEODetailsModal
                    seo={selectedSEO}
                    onClose={() =>
                        setSelectedSEO(null)
                    }
                />
            )}

        </div>
    );
};


/* ======================================================
   STAT CARD
====================================================== */

const StatCard = ({
    title,
    value,
    icon: Icon,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={19} />
                </div>

            </div>

        </div>
    );
};


/* ======================================================
   ASSIGN SEO MODAL
====================================================== */

const AssignSEOModal = ({
    onClose,
    onSuccess,
}) => {
    const [clients, setClients] =
        useState([]);

    const [plans, setPlans] =
        useState([]);

    const [loadingData, setLoadingData] =
        useState(true);

    const [loading, setLoading] =
        useState(false);

    const [form, setForm] =
        useState({
            client: "",
            plan: "",
            startDate: getTodayInputDate(),
            amount: "",
            notes: "",
        });


    /* ======================================================
       LOAD DATA
    ====================================================== */

    const loadData = async () => {
        try {
            setLoadingData(true);

            const [
                clientsResponse,
                plansResponse,
            ] = await Promise.all([
                api.get("/clients"),
                getSEOPlans(),
            ]);

            const clientData =
                clientsResponse?.data?.clients ||
                clientsResponse?.data?.data ||
                clientsResponse?.clients ||
                clientsResponse?.data ||
                [];

            const planData =
                plansResponse?.data?.plans ||
                plansResponse?.data?.data ||
                plansResponse?.plans ||
                plansResponse?.data ||
                [];

            setClients(
                Array.isArray(clientData)
                    ? clientData
                    : []
            );

            setPlans(
                Array.isArray(planData)
                    ? planData
                    : []
            );
        } catch (error) {
            console.error(
                "Failed to load assignment data:",
                error
            );

            setClients([]);
            setPlans([]);

            alert(
                error?.response?.data?.message ||
                "Failed to load clients and SEO plans"
            );
        } finally {
            setLoadingData(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);


    const selectedPlan =
        plans.find(
            (plan) =>
                String(plan._id) ===
                String(form.plan)
        );


    useEffect(() => {
        if (selectedPlan) {
            setForm((prev) => ({
                ...prev,
                amount:
                    selectedPlan.price || 0,
            }));
        }
    }, [selectedPlan]);


    const handleChange = (
        field,
        value
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    const handleSubmit = async (
        e
    ) => {
        e.preventDefault();

        if (!form.client) {
            alert(
                "Please select a client."
            );
            return;
        }

        if (!form.plan) {
            alert(
                "Please select an SEO plan."
            );
            return;
        }

        if (!form.startDate) {
            alert(
                "Please select start date."
            );
            return;
        }

        try {
            setLoading(true);

            await assignSEO({
                client: form.client,
                plan: form.plan,
                startDate: form.startDate,
                amount: Number(
                    form.amount || 0
                ),
                notes: form.notes,
            });

            alert(
                "SEO plan assigned successfully."
            );

            onSuccess();
        } catch (error) {
            console.error(
                "SEO assignment failed:",
                error
            );

            alert(
                error?.response?.data?.message ||
                "Failed to assign SEO plan"
            );
        } finally {
            setLoading(false);
        }
    };


    const activePlans =
        plans.filter(
            (plan) =>
                plan.isActive === true
        );


    return (
        <Modal
            title="Assign SEO Plan"
            onClose={onClose}
        >

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >

                {/* ==================================================
            CLIENT + PLAN
        ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">

                    <div className="mb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                            Assignment
                        </p>

                        <h3 className="mt-1 text-base font-bold text-slate-900">
                            Client & SEO Plan
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Select the client and SEO package you want to assign.
                        </p>
                    </div>


                    <div className="space-y-5">

                        {/* CLIENT */}

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">
                                Client
                            </label>

                            <select
                                required
                                value={form.client}
                                onChange={(e) =>
                                    handleChange(
                                        "client",
                                        e.target.value
                                    )
                                }
                                disabled={
                                    loadingData ||
                                    clients.length === 0
                                }
                                className="input h-11 bg-white"
                            >
                                <option value="">
                                    {loadingData
                                        ? "Loading clients..."
                                        : clients.length === 0
                                            ? "No clients found"
                                            : "Select Client"}
                                </option>

                                {clients.map(
                                    (client) => (
                                        <option
                                            key={client._id}
                                            value={client._id}
                                        >
                                            {client.clientName ||
                                                "Unnamed Client"}

                                            {client.companyName
                                                ? ` — ${client.companyName}`
                                                : ""}
                                        </option>
                                    )
                                )}
                            </select>

                            {!loadingData &&
                                clients.length ===
                                0 && (
                                    <p className="mt-2 text-xs text-red-500">
                                        No clients available.
                                    </p>
                                )}
                        </div>


                        {/* PLAN */}

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">
                                SEO Plan
                            </label>

                            <select
                                required
                                value={form.plan}
                                onChange={(e) =>
                                    handleChange(
                                        "plan",
                                        e.target.value
                                    )
                                }
                                disabled={
                                    loadingData ||
                                    activePlans.length === 0
                                }
                                className="input h-11 bg-white"
                            >
                                <option value="">
                                    {loadingData
                                        ? "Loading SEO plans..."
                                        : activePlans.length ===
                                            0
                                            ? "No active SEO plans"
                                            : "Select SEO Plan"}
                                </option>

                                {activePlans.map(
                                    (plan) => (
                                        <option
                                            key={plan._id}
                                            value={plan._id}
                                        >
                                            {plan.name} — ₹
                                            {Number(
                                                plan.price || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </option>
                                    )
                                )}
                            </select>

                            {!loadingData &&
                                activePlans.length ===
                                0 && (
                                    <p className="mt-2 text-xs text-red-500">
                                        Create an active SEO plan first.
                                    </p>
                                )}
                        </div>

                    </div>

                </div>


                {/* ==================================================
            PLAN PREVIEW
        ================================================== */}

                {selectedPlan && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                        <div className="flex items-center justify-between gap-4">

                            <div>
                                <p className="text-xs font-semibold text-blue-600">
                                    Selected Plan
                                </p>

                                <h4 className="mt-1 text-base font-bold text-slate-900">
                                    {selectedPlan.name}
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                    {selectedPlan.durationInDays ||
                                        selectedPlan.duration ||
                                        0}{" "}
                                    days SEO service
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-slate-400">
                                    Plan Price
                                </p>

                                <p className="mt-1 text-xl font-bold text-blue-700">
                                    ₹
                                    {Number(
                                        selectedPlan.price || 0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </p>
                            </div>

                        </div>

                    </div>
                )}


                {/* ==================================================
            DATE + AMOUNT
        ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

                    <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Plan Details
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">

                        {/* START DATE */}

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">
                                Start Date
                            </label>

                            <div className="relative">

                                <CalendarDays
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="date"
                                    required
                                    value={
                                        form.startDate
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "startDate",
                                            e.target.value
                                        )
                                    }
                                    className="input h-11 bg-slate-50 pl-10"
                                />

                            </div>
                        </div>


                        {/* AMOUNT */}

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">
                                SEO Amount
                            </label>

                            <div className="relative">

                                <IndianRupee
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={
                                        form.amount
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "amount",
                                            e.target.value
                                        )
                                    }
                                    className="input h-11 bg-slate-50 pl-10 font-semibold"
                                    placeholder="Enter amount"
                                />

                            </div>

                            {selectedPlan && (
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Amount is automatically filled from the selected plan.
                                </p>
                            )}

                        </div>

                    </div>

                </div>


                {/* ==================================================
            NOTES
        ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                        Notes
                    </label>

                    <textarea
                        rows="4"
                        value={
                            form.notes
                        }
                        onChange={(e) =>
                            handleChange(
                                "notes",
                                e.target.value
                            )
                        }
                        placeholder="Add any important notes about this SEO assignment..."
                        className="input resize-none bg-slate-50"
                    />

                    <p className="mt-1.5 text-right text-[11px] text-slate-400">
                        Optional
                    </p>

                </div>


                {/* ==================================================
            ACTIONS
        ================================================== */}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            loadingData ||
                            clients.length === 0 ||
                            activePlans.length === 0
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Assign SEO
                            </>
                        )}
                    </button>

                </div>

            </form>

        </Modal>
    );
};


/* ======================================================
   SEO DETAILS MODAL
====================================================== */

const SEODetailsModal = ({
    seo,
    onClose,
}) => {
    const [details, setDetails] =
        useState(seo);

    const [loading, setLoading] =
        useState(true);

    const [activeTab, setActiveTab] =
        useState("monthly");


    /* MONTHLY */

    const [showMonthlyForm, setShowMonthlyForm] =
        useState(false);

    const [editingMonthly, setEditingMonthly] =
        useState(null);

    const [monthlyLoading, setMonthlyLoading] =
        useState(false);


    /* DAILY */

    const [showDailyForm, setShowDailyForm] =
        useState(false);

    const [editingDaily, setEditingDaily] =
        useState(null);

    const [dailyLoading, setDailyLoading] =
        useState(false);


    /* ======================================================
       LOAD DETAILS
    ====================================================== */

    const loadDetails = async () => {
        try {
            setLoading(true);

            const response =
                await getSEOById(
                    seo._id
                );

            const data =
                response?.data?.seo ||
                response?.data?.data ||
                response?.data ||
                response?.seo ||
                response;

            setDetails(
                data || seo
            );
        } catch (error) {
            console.error(
                "Failed to load SEO details:",
                error
            );

            setDetails(seo);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadDetails();
    }, [seo._id]);


    /* ======================================================
       DELETE MONTH
    ====================================================== */

    const handleDeleteMonthly =
        async (trackingId) => {
            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this monthly tracking?"
                );

            if (!confirmed) return;

            try {
                setMonthlyLoading(true);

                await deleteMonthlyTracking(
                    details._id,
                    trackingId
                );

                await loadDetails();
            } catch (error) {
                console.error(
                    "Delete monthly tracking error:",
                    error
                );

                alert(
                    error?.response?.data?.message ||
                    "Failed to delete monthly tracking"
                );
            } finally {
                setMonthlyLoading(false);
            }
        };


    /* ======================================================
       MONTHLY SAVE
    ====================================================== */

    const handleMonthlySubmit =
        async (formData) => {
            try {
                setMonthlyLoading(true);

                if (editingMonthly) {
                    await updateMonthlyTracking(
                        details._id,
                        editingMonthly._id,
                        formData
                    );
                } else {
                    await addMonthlyTracking(
                        details._id,
                        formData
                    );
                }

                setShowMonthlyForm(false);
                setEditingMonthly(null);

                await loadDetails();
            } catch (error) {
                console.error(
                    "Monthly tracking error:",
                    error
                );

                alert(
                    error?.response?.data?.message ||
                    "Failed to save monthly tracking"
                );
            } finally {
                setMonthlyLoading(false);
            }
        };


    /* ======================================================
       DELETE DAILY
    ====================================================== */

    const handleDeleteDaily =
        async (trackingId) => {
            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this daily tracking?"
                );

            if (!confirmed) return;

            try {
                setDailyLoading(true);

                await deleteDailyTracking(
                    details._id,
                    trackingId
                );

                await loadDetails();
            } catch (error) {
                console.error(
                    "Delete daily tracking error:",
                    error
                );

                alert(
                    error?.response?.data?.message ||
                    "Failed to delete daily tracking"
                );
            } finally {
                setDailyLoading(false);
            }
        };


    /* ======================================================
       DAILY SAVE
    ====================================================== */

    const handleDailySubmit =
        async (formData) => {
            try {
                setDailyLoading(true);

                if (editingDaily) {
                    await updateDailyTracking(
                        details._id,
                        editingDaily._id,
                        formData
                    );
                } else {
                    await addDailyTracking(
                        details._id,
                        formData
                    );
                }

                setShowDailyForm(false);
                setEditingDaily(null);

                await loadDetails();
            } catch (error) {
                console.error(
                    "Daily tracking error:",
                    error
                );

                alert(
                    error?.response?.data?.message ||
                    "Failed to save daily tracking"
                );
            } finally {
                setDailyLoading(false);
            }
        };


    return (
        <Modal
            title="SEO Details"
            onClose={onClose}
            wide
        >

            {loading ? (
                <div className="py-16 text-center">

                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                        Loading SEO details...
                    </p>

                </div>
            ) : (
                <div className="space-y-6">

                    {/* HEADER */}

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                    SEO Client
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-900">
                                    {details.client
                                        ?.clientName ||
                                        "Client"}
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    {details.client
                                        ?.companyName ||
                                        details.client
                                            ?.email ||
                                        "-"}
                                </p>

                            </div>

                            <div className="lg:text-right">

                                <p className="text-sm font-semibold text-blue-700">
                                    {details.planName ||
                                        details.plan?.name ||
                                        "-"}
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-900">
                                    {formatCurrency(
                                        details.amount
                                    )}
                                </p>

                                <div className="mt-2">
                                    {statusBadge(
                                        details.status
                                    )}
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* INFO */}

                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                        <InfoBox
                            label="Start Date"
                            value={formatDateValue(
                                details.startDate
                            )}
                        />

                        <InfoBox
                            label="End Date"
                            value={formatDateValue(
                                details.endDate
                            )}
                        />

                        <InfoBox
                            label="Duration"
                            value={`${details.durationInDays || 0} Days`}
                        />

                        <InfoBox
                            label="Total Amount"
                            value={formatCurrency(
                                details.amount
                            )}
                        />

                    </div>


                    {/* TABS */}

                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">

                        <button
                            onClick={() =>
                                setActiveTab("monthly")
                            }
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "monthly"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            <CalendarDays size={16} />
                            Monthly Tracking
                        </button>




                    </div>


                    {/* MONTHLY */}

                    {activeTab === "monthly" && (
                        <MonthlyTrackingSection
                            details={details}
                            onAdd={() => {
                                setEditingMonthly(null);
                                setShowMonthlyForm(true);
                            }}
                            onEdit={(item) => {
                                setEditingMonthly(item);
                                setShowMonthlyForm(true);
                            }}
                            onDelete={
                                handleDeleteMonthly
                            }
                            deleting={
                                monthlyLoading
                            }
                        />
                    )}


                    {/* DAILY */}

                    {activeTab === "daily" && (
                        <DailyTrackingSection
                            details={details}
                            onAdd={() => {
                                setEditingDaily(null);
                                setShowDailyForm(true);
                            }}
                            onEdit={(item) => {
                                setEditingDaily(item);
                                setShowDailyForm(true);
                            }}
                            onDelete={
                                handleDeleteDaily
                            }
                            deleting={
                                dailyLoading
                            }
                        />
                    )}


                    {/* MONTHLY FORM */}

                    {showMonthlyForm && (
                        <MonthlyTrackingModal
                            item={
                                editingMonthly
                            }
                            loading={
                                monthlyLoading
                            }
                            onClose={() => {
                                setShowMonthlyForm(false);
                                setEditingMonthly(null);
                            }}
                            onSubmit={
                                handleMonthlySubmit
                            }
                        />
                    )}


                    {/* DAILY FORM */}

                    {showDailyForm && (
                        <DailyTrackingModal
                            item={
                                editingDaily
                            }
                            loading={
                                dailyLoading
                            }
                            onClose={() => {
                                setShowDailyForm(false);
                                setEditingDaily(null);
                            }}
                            onSubmit={
                                handleDailySubmit
                            }
                        />
                    )}

                </div>
            )}

        </Modal>
    );
};


/* ======================================================
   MONTHLY TRACKING SECTION
====================================================== */

const MonthlyTrackingSection = ({
    details,
    onAdd,
    onEdit,
    onDelete,
    deleting,
}) => {
    const tracking =
        details.monthlyTracking || [];

    return (
        <div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Monthly SEO Tracking
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Month-wise target, completed work, payment and progress.
                    </p>
                </div>

                <button
                    onClick={onAdd}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus size={16} />
                    Add Month
                </button>

            </div>


            {tracking.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">

                    <CalendarDays
                        className="mx-auto text-slate-400"
                        size={28}
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                        No monthly tracking added
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Add the first month to start tracking SEO work.
                    </p>

                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[1180px]">

                        <thead>
                            <tr className="bg-slate-50">

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Month
                                </th>










                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Payment
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Work
                                </th>

                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                                    Actions
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {tracking.map(
                                (item) => {

                                    const total =
                                        Number(
                                            item.paymentAmount || 0
                                        );

                                    const paid =
                                        Math.min(
                                            Math.max(
                                                Number(
                                                    item.paidAmount || 0
                                                ),
                                                0
                                            ),
                                            Math.max(
                                                total,
                                                0
                                            )
                                        );

                                    const remaining =
                                        Math.max(
                                            total - paid,
                                            0
                                        );

                                    const status =
                                        item.paymentStatus ||
                                        (
                                            total <= 0
                                                ? "pending"
                                                : paid >= total
                                                    ? "paid"
                                                    : paid > 0
                                                        ? "partial"
                                                        : "pending"
                                        );

                                    return (
                                        <tr
                                            key={
                                                item._id
                                            }
                                            className="border-t border-slate-100"
                                        >

                                            <td className="px-4 py-3">

                                                <p className="font-semibold text-slate-800">
                                                    {item.month}
                                                </p>

                                                <p className="text-xs text-slate-400">
                                                    {item.year}
                                                </p>

                                            </td>


                                            {/* PAYMENT */}

                                            <td className="px-4 py-3">

                                                <div className="min-w-[145px] space-y-1.5">

                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[11px] text-slate-400">
                                                            Total
                                                        </span>

                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {formatCurrency(
                                                                total
                                                            )}
                                                        </span>
                                                    </div>


                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[11px] text-slate-400">
                                                            Paid
                                                        </span>

                                                        <span className="text-sm font-semibold text-emerald-600">
                                                            {formatCurrency(
                                                                paid
                                                            )}
                                                        </span>
                                                    </div>


                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[11px] text-slate-400">
                                                            Remaining
                                                        </span>

                                                        <span
                                                            className={`text-sm font-semibold ${remaining > 0
                                                                ? "text-orange-600"
                                                                : "text-emerald-600"
                                                                }`}
                                                        >
                                                            {formatCurrency(
                                                                remaining
                                                            )}
                                                        </span>
                                                    </div>


                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${status ===
                                                            "paid"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : status ===
                                                                "partial"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {status ===
                                                            "paid"
                                                            ? "Paid"
                                                            : status ===
                                                                "partial"
                                                                ? "Partially Paid"
                                                                : "Unpaid"}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* WORK */}

                                            <td className="px-4 py-3">

                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                    {formatWorkStatus(
                                                        item.workStatus
                                                    )}
                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td className="px-4 py-3">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        onClick={() =>
                                                            onEdit(item)
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil
                                                            size={14}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            onDelete(
                                                                item._id
                                                            )
                                                        }
                                                        disabled={
                                                            deleting
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2
                                                            size={14}
                                                        />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>
            )}

        </div>
    );
};


/* ======================================================
   MONTHLY TRACKING MODAL
====================================================== */

const MonthlyTrackingModal = ({
    item,
    loading,
    onClose,
    onSubmit,
}) => {

    const [form, setForm] =
        useState({
            month:
                item?.month ||
                getCurrentMonth(),

            year:
                item?.year ||
                new Date().getFullYear(),

            keywordsTarget:
                item?.keywordsTarget ??
                0,

            keywordsCompleted:
                item?.keywordsCompleted ??
                0,

            backlinksTarget:
                item?.backlinksTarget ??
                0,

            backlinksCompleted:
                item?.backlinksCompleted ??
                0,

            blogsTarget:
                item?.blogsTarget ??
                0,

            blogsCompleted:
                item?.blogsCompleted ??
                0,

            onPageTarget:
                item?.onPageTarget ??
                0,

            onPageCompleted:
                item?.onPageCompleted ??
                0,

            technicalTarget:
                item?.technicalTarget ??
                0,

            technicalCompleted:
                item?.technicalCompleted ??
                0,

            rankingImproved:
                item?.rankingImproved ??
                0,

            paymentAmount:
                item?.paymentAmount ??
                0,

            paidAmount:
                item?.paidAmount ??
                0,

            workStatus:
                item?.workStatus ||
                "pending",

            notes:
                item?.notes || "",
        });


    const handleChange = (
        field,
        value
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    /* ======================================================
       PAYMENT CALCULATION
    ====================================================== */

    const totalAmount =
        Math.max(
            Number(
                form.paymentAmount || 0
            ),
            0
        );

    const enteredPaidAmount =
        Math.max(
            Number(
                form.paidAmount || 0
            ),
            0
        );

    const paidAmount =
        Math.min(
            enteredPaidAmount,
            totalAmount
        );

    const remainingAmount =
        Math.max(
            totalAmount -
            paidAmount,
            0
        );

    const paymentStatus =
        totalAmount <= 0
            ? "pending"
            : paidAmount >= totalAmount
                ? "paid"
                : paidAmount > 0
                    ? "partial"
                    : "pending";


    const paymentStatusLabel = {
        pending: "Unpaid",
        partial: "Partially Paid",
        paid: "Paid",
    };


    /* ======================================================
       SUBMIT
    ====================================================== */

    const submit = (e) => {
        e.preventDefault();

        onSubmit({
            ...form,

            year: Number(
                form.year
            ),

            keywordsTarget:
                Number(
                    form.keywordsTarget
                ),

            keywordsCompleted:
                Number(
                    form.keywordsCompleted
                ),

            backlinksTarget:
                Number(
                    form.backlinksTarget
                ),

            backlinksCompleted:
                Number(
                    form.backlinksCompleted
                ),

            blogsTarget:
                Number(
                    form.blogsTarget
                ),

            blogsCompleted:
                Number(
                    form.blogsCompleted
                ),

            onPageTarget:
                Number(
                    form.onPageTarget
                ),

            onPageCompleted:
                Number(
                    form.onPageCompleted
                ),

            technicalTarget:
                Number(
                    form.technicalTarget
                ),

            technicalCompleted:
                Number(
                    form.technicalCompleted
                ),

            rankingImproved:
                Number(
                    form.rankingImproved
                ),

            paymentAmount:
                totalAmount,

            paidAmount:
                paidAmount,
        });
    };


    return (
        <Modal
            title={item ? "Edit Monthly Tracking" : "Add Monthly Tracking"}
            onClose={onClose}

        >

            <form onSubmit={submit} className="space-y-5">


                {/* MONTH / YEAR */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-900">
                            Tracking Period
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Select the month and year for this SEO tracking record.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label">Month</label>

                            <select
                                value={form.month}
                                onChange={(e) =>
                                    handleChange("month", e.target.value)
                                }
                                className="input"
                            >
                                {[
                                    "January",
                                    "February",
                                    "March",
                                    "April",
                                    "May",
                                    "June",
                                    "July",
                                    "August",
                                    "September",
                                    "October",
                                    "November",
                                    "December",
                                ].map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Year  </label>

                            <input
                                type="number"
                                value={form.year}
                                onChange={(e) =>
                                    handleChange("year", e.target.value)
                                }
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* SEO WORK */}


                {/* PAYMENT */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                    {/* PAYMENT HEADER */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Payment Details
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Track total payment, received amount and remaining balance.
                            </p>
                        </div>

                        <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : paymentStatus === "partial"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                        >
                            {paymentStatusLabel[paymentStatus]}
                        </span>
                    </div>

                    <div className="p-5">

                        {/* PAYMENT INPUTS */}
                        <div className="grid gap-4 sm:grid-cols-2">

                            {/* TOTAL */}
                            <div>
                                <label className="label">
                                    Total Amount
                                </label>

                                <div className="relative">
                                    <IndianRupee
                                        size={15}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        value={form.paymentAmount}
                                        onChange={(e) =>
                                            handleChange(
                                                "paymentAmount",
                                                e.target.value
                                            )
                                        }
                                        className="input h-11 bg-slate-50 pl-9 font-medium"
                                        placeholder="Enter total amount"
                                    />
                                </div>
                            </div>

                            {/* PAID */}
                            <div>
                                <label className="label">
                                    Paid Amount
                                </label>

                                <div className="relative">
                                    <IndianRupee
                                        size={15}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        max={totalAmount}
                                        value={form.paidAmount}
                                        onChange={(e) =>
                                            handleChange(
                                                "paidAmount",
                                                e.target.value
                                            )
                                        }
                                        className="input h-11 bg-slate-50 pl-9 font-medium"
                                        placeholder="Enter received amount"
                                    />
                                </div>

                                {enteredPaidAmount > totalAmount &&
                                    totalAmount > 0 && (
                                        <p className="mt-1.5 text-xs font-medium text-orange-600">
                                            Paid amount cannot exceed total amount.
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* PAYMENT SUMMARY */}
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                            {/* TOTAL */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Total
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-800">
                                    {formatCurrency(totalAmount)}
                                </p>
                            </div>

                            {/* PAID */}
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                                    Paid
                                </p>

                                <p className="mt-1 text-lg font-bold text-emerald-700">
                                    {formatCurrency(paidAmount)}
                                </p>
                            </div>

                            {/* REMAINING */}
                            <div
                                className={`rounded-xl border px-4 py-3.5 ${remainingAmount > 0
                                    ? "border-orange-100 bg-orange-50/60"
                                    : "border-emerald-100 bg-emerald-50/60"
                                    }`}
                            >
                                <p
                                    className={`text-[11px] font-semibold uppercase tracking-wide ${remainingAmount > 0
                                        ? "text-orange-600"
                                        : "text-emerald-600"
                                        }`}
                                >
                                    Remaining
                                </p>

                                <p
                                    className={`mt-1 text-lg font-bold ${remainingAmount > 0
                                        ? "text-orange-700"
                                        : "text-emerald-700"
                                        }`}
                                >
                                    {formatCurrency(remainingAmount)}
                                </p>
                            </div>
                        </div>

                        {/* PAYMENT STATUS */}
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    Payment Status
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Automatically calculated from paid amount
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${paymentStatus === "paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : paymentStatus === "partial"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-200 text-slate-600"
                                    }`}
                            >
                                {paymentStatusLabel[paymentStatus]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* WORK STATUS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-3">
                        <label className="label">
                            Work Status
                        </label>

                        <p className="mt-1 text-xs text-slate-500">
                            Current status of this month's SEO work.
                        </p>
                    </div>

                    <select
                        value={form.workStatus}
                        onChange={(e) =>
                            handleChange(
                                "workStatus",
                                e.target.value
                            )
                        }
                        className="input"
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
                    </select>
                </div>

                {/* NOTES */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="label">
                        Notes
                    </label>

                    <p className="mb-3 mt-1 text-xs text-slate-500">
                        Add any important notes about this month's SEO work.
                    </p>

                    <textarea
                        rows="4"
                        value={form.notes}
                        onChange={(e) =>
                            handleChange("notes", e.target.value)
                        }
                        placeholder="Monthly SEO work notes..."
                        className="input resize-none"
                    />
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Saving..."
                            : item
                                ? "Update Month"
                                : "Add Month"}
                    </button>
                </div>


            </form>
        </Modal>

    );
};


/* ======================================================
   DAILY TRACKING SECTION
====================================================== */

const DailyTrackingSection = ({
    details,
    onAdd,
    onEdit,
    onDelete,
    deleting,
}) => {
    const dailyTracking =
        details.dailyTracking || [];

    const sortedTracking = [
        ...dailyTracking,
    ].sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );

    return (
        <div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Daily SEO Tracking
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Track the actual SEO work performed each day.
                    </p>
                </div>

                <button
                    onClick={onAdd}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus size={16} />
                    Add Day
                </button>

            </div>


            {dailyTracking.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">

                    <Activity
                        className="mx-auto text-slate-400"
                        size={28}
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                        No daily tracking added
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                        Add a daily SEO activity to start tracking the work performed for this client.
                    </p>

                    <button
                        onClick={onAdd}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <Plus size={16} />
                        Add First Day
                    </button>

                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[1100px]">

                        <thead>
                            <tr className="bg-slate-50">

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Keywords
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Backlinks
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Blogs
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    On Page
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Technical
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                                    Actions
                                </th>

                            </tr>
                        </thead>


                        <tbody>

                            {sortedTracking.map(
                                (item) => (
                                    <tr
                                        key={
                                            item._id
                                        }
                                        className="border-t border-slate-100"
                                    >

                                        <td className="px-4 py-3">

                                            <p className="text-sm font-semibold text-slate-800">
                                                {formatDateValue(
                                                    item.date
                                                )}
                                            </p>

                                        </td>


                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.keywordsCompleted ??
                                                0}
                                        </td>


                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.backlinksCompleted ??
                                                0}
                                        </td>


                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.blogsCompleted ??
                                                0}
                                        </td>


                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.onPageCompleted ??
                                                0}
                                        </td>


                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.technicalCompleted ??
                                                0}
                                        </td>


                                        <td className="px-4 py-3">

                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.workStatus ===
                                                    "completed"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : item.workStatus ===
                                                        "in-progress"
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {formatWorkStatus(
                                                    item.workStatus
                                                )}
                                            </span>

                                        </td>


                                        <td className="px-4 py-3">

                                            <div className="flex justify-end gap-2">

                                                <button
                                                    onClick={() =>
                                                        onEdit(item)
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                    title="Edit"
                                                >
                                                    <Pencil
                                                        size={14}
                                                    />
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        onDelete(
                                                            item._id
                                                        )
                                                    }
                                                    disabled={
                                                        deleting
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2
                                                        size={14}
                                                    />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                </div>
            )}

        </div>
    );
};


/* ======================================================
   DAILY TRACKING MODAL
====================================================== */

const DailyTrackingModal = ({
    item,
    loading,
    onClose,
    onSubmit,
}) => {
    const [form, setForm] =
        useState({
            date:
                getDateInputValue(
                    item?.date
                ),

            keywordsCompleted:
                item?.keywordsCompleted ??
                0,

            backlinksCompleted:
                item?.backlinksCompleted ??
                0,

            blogsCompleted:
                item?.blogsCompleted ??
                0,

            onPageCompleted:
                item?.onPageCompleted ??
                0,

            technicalCompleted:
                item?.technicalCompleted ??
                0,

            workStatus:
                item?.workStatus ||
                "pending",

            notes:
                item?.notes ||
                "",
        });


    const handleChange = (
        field,
        value
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    const submit = (e) => {
        e.preventDefault();

        if (!form.date) {
            alert(
                "Please select a date."
            );
            return;
        }

        onSubmit({
            date: form.date,

            keywordsCompleted:
                Number(
                    form.keywordsCompleted
                ),

            backlinksCompleted:
                Number(
                    form.backlinksCompleted
                ),

            blogsCompleted:
                Number(
                    form.blogsCompleted
                ),

            onPageCompleted:
                Number(
                    form.onPageCompleted
                ),

            technicalCompleted:
                Number(
                    form.technicalCompleted
                ),

            workStatus:
                form.workStatus,

            notes:
                form.notes,
        });
    };


    return (
        <Modal
            title={
                item
                    ? "Edit Daily Tracking"
                    : "Add Daily Tracking"
            }
            onClose={onClose}
        >

            <form
                onSubmit={submit}
                className="space-y-5"
            >

                {/* DATE */}

                <div>
                    <label className="label">
                        Date
                    </label>

                    <input
                        type="date"
                        required
                        value={
                            form.date
                        }
                        onChange={(e) =>
                            handleChange(
                                "date",
                                e.target.value
                            )
                        }
                        className="input"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                        Date must be within the SEO plan duration.
                    </p>
                </div>


                {/* DAILY WORK */}

                <div className="rounded-xl border border-slate-200 p-4">

                    <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">

                        <Activity
                            size={17}
                            className="text-blue-600"
                        />

                        Daily SEO Work

                    </h3>


                    <div className="grid gap-4 sm:grid-cols-2">

                        <MetricInput
                            label="Keywords Completed"
                            value={
                                form.keywordsCompleted
                            }
                            onChange={(v) =>
                                handleChange(
                                    "keywordsCompleted",
                                    v
                                )
                            }
                        />


                        <MetricInput
                            label="Backlinks Completed"
                            value={
                                form.backlinksCompleted
                            }
                            onChange={(v) =>
                                handleChange(
                                    "backlinksCompleted",
                                    v
                                )
                            }
                        />


                        <MetricInput
                            label="Blogs Completed"
                            value={
                                form.blogsCompleted
                            }
                            onChange={(v) =>
                                handleChange(
                                    "blogsCompleted",
                                    v
                                )
                            }
                        />


                        <MetricInput
                            label="On Page Completed"
                            value={
                                form.onPageCompleted
                            }
                            onChange={(v) =>
                                handleChange(
                                    "onPageCompleted",
                                    v
                                )
                            }
                        />


                        <MetricInput
                            label="Technical Completed"
                            value={
                                form.technicalCompleted
                            }
                            onChange={(v) =>
                                handleChange(
                                    "technicalCompleted",
                                    v
                                )
                            }
                        />

                    </div>

                </div>


                {/* STATUS */}

                <div>

                    <label className="label">
                        Work Status
                    </label>

                    <select
                        value={
                            form.workStatus
                        }
                        onChange={(e) =>
                            handleChange(
                                "workStatus",
                                e.target.value
                            )
                        }
                        className="input"
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

                    </select>

                </div>


                {/* NOTES */}

                <div>

                    <label className="label">
                        Daily Notes
                    </label>

                    <textarea
                        rows="4"
                        maxLength="1000"
                        value={
                            form.notes
                        }
                        onChange={(e) =>
                            handleChange(
                                "notes",
                                e.target.value
                            )
                        }
                        placeholder="What work was completed today?"
                        className="input resize-none"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                        {form.notes.length}/1000
                    </p>

                </div>


                {/* BUTTONS */}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading
                            ? "Saving..."
                            : item
                                ? "Update Day"
                                : "Add Day"}
                    </button>

                </div>

            </form>

        </Modal>
    );
};


/* ======================================================
   METRIC INPUT
====================================================== */

const MetricInput = ({
    label,
    value,
    onChange,
}) => {
    return (
        <div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}
            </label>

            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }
                className="input"
            />

        </div>
    );
};


/* ======================================================
   INFO BOX
====================================================== */

const InfoBox = ({
    label,
    value,
}) => {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">

            <p className="text-xs font-medium text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
                {value}
            </p>

        </div>
    );
};


/* ======================================================
   MODAL
====================================================== */

const Modal = ({
    title,
    children,
    onClose,
    wide = false,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">

            <div
                className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide
                    ? "max-w-7xl"
                    : "max-w-xl"
                    }`}
            >

                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

                    <h2 className="text-lg font-bold text-slate-900">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        ×
                    </button>

                </div>

                <div className="p-5">
                    {children}
                </div>

            </div>

        </div>
    );
};


/* ======================================================
   HELPERS
====================================================== */

const formatCurrency = (
    amount
) => {
    return `₹${Number(
        amount || 0
    ).toLocaleString("en-IN")}`;
};


const formatDateValue = (
    date
) => {
    if (!date) return "-";

    const parsedDate =
        new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "-";
    }

    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};


const getTodayInputDate = () => {
    const date = new Date();

    const year =
        date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const getDateInputValue = (
    value
) => {
    if (!value) {
        return getTodayInputDate();
    }

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(
            value
        )
    ) {
        return value.slice(
            0,
            10
        );
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return getTodayInputDate();
    }

    const year =
        date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const getCurrentMonth = () => {
    return new Date().toLocaleString(
        "en-US",
        {
            month: "long",
        }
    );
};


const formatWorkStatus = (
    status
) => {
    if (
        status === "in-progress"
    ) {
        return "In Progress";
    }

    if (
        status === "completed"
    ) {
        return "Completed";
    }

    return "Pending";
};


const statusBadge = (status) => {
    if (status === "active") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <CheckCircle2 size={13} />
                Active
            </span>
        );
    }

    if (status === "expired") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                <XCircle size={13} />
                Expired
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            <XCircle size={13} />
            Cancelled
        </span>
    );
};


export default SEO;
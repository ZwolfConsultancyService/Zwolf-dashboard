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
    AlertCircle,
    FileText,
    BookOpen,
    MapPin,
    Link as LinkIcon,
    LayoutDashboard,
    Sparkles,
} from "lucide-react";

import api from "../../../api/axios.js";

import {
    getAllSEO,
    getSEOPlans,
    assignSEO,
    getSEOById,
    updateSEOStatus,
    deleteSEO,
    addMonthlyTracking,
    updateMonthlyTracking,
    deleteMonthlyTracking,
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

            const data =
                response?.data?.records ||
                response?.data?.seo ||
                response?.data?.data ||
                response?.data ||
                response?.records ||
                response?.seo ||
                [];

            setSeoList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch SEO:", error);
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
       HELPERS — WORK SUMMARY CALCULATION
    ====================================================== */

    const calcWorkTotals = (seo) => {
        const monthlyTracking = seo?.monthlyTracking || [];

        const totals = monthlyTracking.reduce(
            (acc, item) => {
                acc.blogsTarget += Number(item.blogsTarget || 0);
                acc.blogsCompleted += Number(item.blogsCompleted || 0);
                acc.caseStudiesTarget += Number(item.caseStudiesTarget || 0);
                acc.caseStudiesCompleted += Number(item.caseStudiesCompleted || 0);
                acc.gmbTarget += Number(item.gmbTarget || 0);
                acc.gmbCompleted += Number(item.gmbCompleted || 0);
                acc.keywordsTarget += Number(item.keywordsTarget || 0);
                acc.keywordsCompleted += Number(item.keywordsCompleted || 0);
                acc.backlinksTarget += Number(item.backlinksTarget || 0);
                acc.backlinksCompleted += Number(item.backlinksCompleted || 0);
                return acc;
            },
            {
                blogsTarget: 0, blogsCompleted: 0,
                caseStudiesTarget: 0, caseStudiesCompleted: 0,
                gmbTarget: 0, gmbCompleted: 0,
                keywordsTarget: 0, keywordsCompleted: 0,
                backlinksTarget: 0, backlinksCompleted: 0,
            }
        );

        const totalPending =
            Math.max(totals.blogsTarget - totals.blogsCompleted, 0) +
            Math.max(totals.caseStudiesTarget - totals.caseStudiesCompleted, 0) +
            Math.max(totals.gmbTarget - totals.gmbCompleted, 0) +
            Math.max(totals.keywordsTarget - totals.keywordsCompleted, 0) +
            Math.max(totals.backlinksTarget - totals.backlinksCompleted, 0);

        const totalTarget =
            totals.blogsTarget +
            totals.caseStudiesTarget +
            totals.gmbTarget +
            totals.keywordsTarget +
            totals.backlinksTarget;

        const totalCompleted =
            Math.min(totals.blogsCompleted, totals.blogsTarget) +
            Math.min(totals.caseStudiesCompleted, totals.caseStudiesTarget) +
            Math.min(totals.gmbCompleted, totals.gmbTarget) +
            Math.min(totals.keywordsCompleted, totals.keywordsTarget) +
            Math.min(totals.backlinksCompleted, totals.backlinksTarget);

        const isFullyDone = totalTarget > 0 && totalPending === 0;

        return {
            totals,
            totalPending,
            totalTarget,
            totalCompleted,
            isFullyDone,
            hasData: totalTarget > 0,
        };
    };


    /* ======================================================
       FILTER
    ====================================================== */

    const filteredSEO = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        return seoList.filter((seo) => {
            const clientName = seo?.client?.clientName || "";
            const companyName = seo?.client?.companyName || "";
            const clientEmail = seo?.client?.email || "";
            const planName = seo?.planName || seo?.plan?.name || "";

            const matchesSearch =
                !searchText ||
                clientName.toLowerCase().includes(searchText) ||
                companyName.toLowerCase().includes(searchText) ||
                clientEmail.toLowerCase().includes(searchText) ||
                planName.toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "all" ||
                seo.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [seoList, search, statusFilter]);


    /* ======================================================
       SORTED FOR WORK SUMMARY
       Latest active first, completed last
    ====================================================== */

    const sortedSEOForWork = useMemo(() => {
        return [...filteredSEO].sort((a, b) => {
            const aStats = calcWorkTotals(a);
            const bStats = calcWorkTotals(b);

            /* Priority scoring */
            const getPriority = (seo, stats) => {
                /* 0 = completed (bottom) */
                if (stats.isFullyDone) return 3;

                /* 1 = pending work (top) */
                if (stats.hasData && stats.totalPending > 0) return 0;

                /* 2 = no data yet */
                return 1;
            };

            const aP = getPriority(a, aStats);
            const bP = getPriority(b, bStats);

            if (aP !== bP) return aP - bP;

            /* Within same priority — latest first (createdAt) */
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();

            return bTime - aTime;
        });
    }, [filteredSEO]);


    /* ======================================================
       STATS
    ====================================================== */

    const stats = useMemo(() => {
        const active = seoList.filter((item) => item.status === "active").length;
        const expired = seoList.filter((item) => item.status === "expired").length;

        const revenue = seoList.reduce(
            (total, item) => total + Number(item.amount || 0),
            0
        );

        const expiring = seoList.filter((item) => {
            if (item.status !== "active" || !item.endDate) return false;

            const endDate = new Date(item.endDate);
            const diff = Math.ceil(
                (endDate - new Date()) / (1000 * 60 * 60 * 24)
            );

            return diff >= 0 && diff <= 30;
        }).length;

        return {
            total: seoList.length,
            active,
            expired,
            revenue,
            expiring,
        };
    }, [seoList]);


    /* ======================================================
       STATUS CHANGE
    ====================================================== */

    const handleStatusChange = async (id, status) => {
        try {
            await updateSEOStatus(id, status);
            await fetchSEO();
        } catch (error) {
            console.error("Status update failed:", error);
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
            (item) => String(item._id) === String(id)
        );

        const clientName = seo?.client?.clientName || "this client";

        const confirmed = window.confirm(
            `Are you sure you want to delete the SEO record for ${clientName}?\n\nThis will permanently delete the SEO record, monthly tracking and daily tracking data.\n\nThe client itself will NOT be deleted.`
        );

        if (!confirmed) return;

        try {
            setDeletingSEO(true);
            await deleteSEO(id);

            setSeoList((prev) =>
                prev.filter((item) => String(item._id) !== String(id))
            );

            if (selectedSEO && String(selectedSEO._id) === String(id)) {
                setSelectedSEO(null);
            }

            alert("SEO record deleted successfully.");
        } catch (error) {
            console.error("Delete SEO error:", error);
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
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return "-";
        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatAmount = (amount) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) return null;
        return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = [
            "bg-blue-100 text-blue-700",
            "bg-emerald-100 text-emerald-700",
            "bg-purple-100 text-purple-700",
            "bg-pink-100 text-pink-700",
            "bg-amber-100 text-amber-700",
            "bg-cyan-100 text-cyan-700",
            "bg-indigo-100 text-indigo-700",
            "bg-rose-100 text-rose-700",
        ];
        if (!name) return colors[0];
        return colors[name.charCodeAt(0) % colors.length];
    };


    /* ======================================================
       UI
    ====================================================== */

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-[1800px]">

                {/* HEADER */}
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                            <LayoutDashboard size={26} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                SEO Management
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Manage SEO plans, track work progress and monitor client performance.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchSEO}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        <button
                            onClick={() => setShowAssign(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:shadow-blue-500/40"
                        >
                            <Plus size={17} />
                            Assign SEO
                        </button>
                    </div>
                </div>


                {/* STATS */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard title="Total Clients" value={stats.total} icon={Users} color="blue" />
                    <StatCard title="Active Plans" value={stats.active} icon={CheckCircle2} color="emerald" />
                    <StatCard title="Expiring Soon" value={stats.expiring} icon={Clock3} color="amber" />
                    <StatCard title="Expired" value={stats.expired} icon={XCircle} color="red" />
                    <StatCard title="Total Value" value={formatAmount(stats.revenue)} icon={IndianRupee} color="purple" />
                </div>


                {/* ==================================================
                    MAIN TABLE (Clean — NO Work Summary)
                ================================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">

                    {/* FILTER BAR */}
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="relative w-full lg:max-w-md">
                            <Search
                                size={17}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                placeholder="Search client, company or SEO plan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>


                    {/* TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Users size={13} className="text-slate-400" />
                                            Client
                                        </div>
                                    </th>

                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Target size={13} className="text-slate-400" />
                                            SEO Plan
                                        </div>
                                    </th>

                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={13} className="text-slate-400" />
                                            Duration
                                        </div>
                                    </th>

                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={13} className="text-slate-400" />
                                            Amount
                                        </div>
                                    </th>

                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={13} className="text-slate-400" />
                                            Payment
                                        </div>
                                    </th>

                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-20 text-center">
                                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
                                            <p className="mt-4 text-sm font-medium text-slate-500">
                                                Loading SEO records...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredSEO.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-20 text-center">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                                                <Search size={26} />
                                            </div>
                                            <p className="mt-4 text-base font-bold text-slate-800">
                                                No SEO records found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Assign an SEO plan to a client to get started.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSEO.map((seo, index) => {
                                        const days = getDaysRemaining(seo.endDate);
                                        const totalPlanAmount = Number(seo.amount || 0);

                                        const totalPaidAmount =
                                            seo.monthlyTracking?.reduce(
                                                (total, item) =>
                                                    total + Number(item.paidAmount || 0),
                                                0
                                            ) || 0;

                                        const paidAmount = Math.min(totalPaidAmount, totalPlanAmount);
                                        const remainingAmount = Math.max(totalPlanAmount - paidAmount, 0);

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
                                                className={`border-b border-slate-100 transition-all duration-200 hover:bg-blue-50/40 ${index % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}
                                            >
                                                {/* CLIENT */}
                                                <td className="px-5 py-5 align-top">
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${getAvatarColor(seo.client?.clientName)}`}
                                                        >
                                                            {getInitials(seo.client?.clientName)}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900">
                                                                {seo.client?.clientName || "Unknown Client"}
                                                            </p>
                                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                                {seo.client?.companyName || seo.client?.email || "-"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* SEO PLAN */}
                                                <td className="px-5 py-5 align-top">
                                                    <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5">
                                                        <Target size={13} className="text-indigo-600" />
                                                        <span className="text-sm font-semibold text-indigo-800">
                                                            {seo.planName || seo.plan?.name || "-"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1.5 text-xs font-medium text-slate-400">
                                                        {seo.durationInDays || 0} days plan
                                                    </p>
                                                </td>

                                                {/* DURATION */}
                                                <td className="px-5 py-5 align-top">
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {formatDate(seo.startDate)}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        to {formatDate(seo.endDate)}
                                                    </p>

                                                    {seo.status === "active" && days !== null && (
                                                        <div
                                                            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${days <= 30 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                                                        >
                                                            <Clock3 size={10} />
                                                            {days >= 0 ? `${days} days left` : "Expired"}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* AMOUNT */}
                                                <td className="px-5 py-5 align-top">
                                                    <p className="text-lg font-bold text-slate-800">
                                                        {formatAmount(totalPlanAmount)}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-slate-400">
                                                        Full plan amount
                                                    </p>
                                                </td>

                                                {/* PAYMENT */}
                                                <td className="px-5 py-5 align-top">
                                                    <div className="min-w-[165px]">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                                Status
                                                            </span>

                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : paymentStatus === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full ${paymentStatus === "paid" ? "bg-emerald-500" : paymentStatus === "partial" ? "bg-amber-500" : "bg-red-500"}`}
                                                                />
                                                                {paymentStatus === "paid" ? "Paid" : paymentStatus === "partial" ? "Partial" : "Unpaid"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-2.5 space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] text-slate-400">Paid</span>
                                                                <span className="text-xs font-bold text-emerald-600">
                                                                    {formatAmount(paidAmount)}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] text-slate-400">Due</span>
                                                                <span className={`text-xs font-bold ${remainingAmount > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                                                                    {formatAmount(remainingAmount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-5 py-5 align-top">
                                                    {statusBadge(seo.status)}
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="px-5 py-5 align-top">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setSelectedSEO(seo)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {seo.status === "active" && (
                                                            <button
                                                                onClick={() => handleStatusChange(seo._id, "cancelled")}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                                                                title="Cancel SEO"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteSEO(seo._id)}
                                                            disabled={deletingSEO}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
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


                {/* ==================================================
                    WORK SUMMARY SECTION (Separate Component)
                ================================================== */}

                <div className="mt-10">

                    {/* SECTION HEADER */}
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                                <Activity size={22} />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    SEO Work Progress
                                </h2>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    Client-wise work summary — pending clients on top, completed below.
                                </p>
                            </div>
                        </div>

                        {/* PENDING COUNT BADGE */}
                        {sortedSEOForWork.length > 0 && (
                            <PendingCountBadge seoList={sortedSEOForWork} />
                        )}

                    </div>

                    {/* WORK SUMMARY GRID */}
                    {sortedSEOForWork.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                            <Activity className="mx-auto text-slate-400" size={32} />
                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                No work data available
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Assign SEO plans and add monthly tracking to see work progress.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {sortedSEOForWork.map((seo) => (
                                <ClientWorkCard
                                    key={seo._id}
                                    seo={seo}
                                    onView={() => setSelectedSEO(seo)}
                                />
                            ))}
                        </div>
                    )}

                </div>

            </div>


            {/* MODALS */}
            {showAssign && (
                <AssignSEOModal
                    onClose={() => setShowAssign(false)}
                    onSuccess={() => {
                        setShowAssign(false);
                        fetchSEO();
                    }}
                />
            )}

            {selectedSEO && (
                <SEODetailsModal
                    seo={selectedSEO}
                    onClose={() => setSelectedSEO(null)}
                />
            )}

        </div>
    );
};


/* ======================================================
   PENDING COUNT BADGE
====================================================== */

const PendingCountBadge = ({ seoList }) => {
    const pendingClients = seoList.filter((seo) => {
        const monthlyTracking = seo?.monthlyTracking || [];

        if (monthlyTracking.length === 0) return false;

        const totals = monthlyTracking.reduce(
            (acc, item) => {
                acc.blogsT += Number(item.blogsTarget || 0);
                acc.blogsC += Number(item.blogsCompleted || 0);
                acc.caseT += Number(item.caseStudiesTarget || 0);
                acc.caseC += Number(item.caseStudiesCompleted || 0);
                acc.gmbT += Number(item.gmbTarget || 0);
                acc.gmbC += Number(item.gmbCompleted || 0);
                return acc;
            },
            { blogsT: 0, blogsC: 0, caseT: 0, caseC: 0, gmbT: 0, gmbC: 0 }
        );

        return (
            totals.blogsT > totals.blogsC ||
            totals.caseT > totals.caseC ||
            totals.gmbT > totals.gmbC
        );
    }).length;

    if (pendingClients === 0) {
        return (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 size={15} />
                All clients up to date
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 ring-1 ring-orange-200">
            <AlertCircle size={15} />
            {pendingClients} client{pendingClients > 1 ? "s" : ""} have pending work
        </div>
    );
};


/* ======================================================
   CLIENT WORK CARD (Alag Component)
====================================================== */

const ClientWorkCard = ({ seo, onView }) => {
    const monthlyTracking = seo?.monthlyTracking || [];

    const totals = monthlyTracking.reduce(
        (acc, item) => {
            acc.blogsTarget += Number(item.blogsTarget || 0);
            acc.blogsCompleted += Number(item.blogsCompleted || 0);
            acc.caseStudiesTarget += Number(item.caseStudiesTarget || 0);
            acc.caseStudiesCompleted += Number(item.caseStudiesCompleted || 0);
            acc.gmbTarget += Number(item.gmbTarget || 0);
            acc.gmbCompleted += Number(item.gmbCompleted || 0);
            acc.keywordsTarget += Number(item.keywordsTarget || 0);
            acc.keywordsCompleted += Number(item.keywordsCompleted || 0);
            acc.backlinksTarget += Number(item.backlinksTarget || 0);
            acc.backlinksCompleted += Number(item.backlinksCompleted || 0);
            return acc;
        },
        {
            blogsTarget: 0, blogsCompleted: 0,
            caseStudiesTarget: 0, caseStudiesCompleted: 0,
            gmbTarget: 0, gmbCompleted: 0,
            keywordsTarget: 0, keywordsCompleted: 0,
            backlinksTarget: 0, backlinksCompleted: 0,
        }
    );

    const works = [
        { label: "Blogs", target: totals.blogsTarget, completed: totals.blogsCompleted, icon: FileText, color: "blue" },
        { label: "Case Studies", target: totals.caseStudiesTarget, completed: totals.caseStudiesCompleted, icon: BookOpen, color: "purple" },
        { label: "GMB", target: totals.gmbTarget, completed: totals.gmbCompleted, icon: MapPin, color: "emerald" },
        { label: "Keywords", target: totals.keywordsTarget, completed: totals.keywordsCompleted, icon: Target, color: "amber" },
        { label: "Backlinks", target: totals.backlinksTarget, completed: totals.backlinksCompleted, icon: LinkIcon, color: "cyan" },
    ];

    const visibleWorks = works.filter((w) => w.target > 0 || w.completed > 0);

    const totalPending = visibleWorks.reduce(
        (sum, w) => sum + Math.max(Number(w.target) - Number(w.completed), 0),
        0
    );

    const totalTarget = visibleWorks.reduce((sum, w) => sum + Number(w.target), 0);
    const totalCompleted = visibleWorks.reduce(
        (sum, w) => sum + Math.min(Number(w.completed), Number(w.target)),
        0
    );

    const overallPct = totalTarget > 0
        ? Math.min(Math.round((totalCompleted / totalTarget) * 100), 100)
        : 0;

    const hasData = visibleWorks.length > 0;
    const isFullyDone = hasData && totalPending === 0;

    const daysLeft = seo?.endDate
        ? Math.ceil((new Date(seo.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && totalPending > 0;

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isFullyDone
                ? "border-emerald-200 shadow-emerald-100/50"
                : isUrgent
                    ? "border-red-200 shadow-red-100/50"
                    : totalPending > 0
                        ? "border-orange-200 shadow-orange-100/50"
                        : "border-slate-200"
                }`}
        >
            {/* TOP ACCENT */}
            <div
                className={`h-1.5 w-full ${isFullyDone
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : isUrgent
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : totalPending > 0
                            ? "bg-gradient-to-r from-orange-400 to-orange-500"
                            : "bg-gradient-to-r from-slate-300 to-slate-400"
                    }`}
            />

            <div className="p-5">

                {/* HEADER */}
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-slate-900">
                            {seo.client?.clientName || "Unknown Client"}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                            {seo.client?.companyName || seo.client?.email || "-"}
                        </p>
                    </div>

                    {hasData && (
                        <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${isFullyDone
                                ? "bg-emerald-100 text-emerald-700"
                                : isUrgent
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                        >
                            {isFullyDone ? "✅ Done" : `⚠ ${totalPending}`}
                        </span>
                    )}
                </div>

                {/* PLAN + DAYS */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1">
                        <Target size={11} className="text-indigo-600" />
                        <span className="text-[11px] font-semibold text-indigo-800">
                            {seo.planName || seo.plan?.name || "-"}
                        </span>
                    </div>

                    {daysLeft !== null && (
                        <div
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold ${daysLeft < 0
                                ? "bg-slate-100 text-slate-600"
                                : daysLeft <= 7
                                    ? "bg-red-50 text-red-700"
                                    : daysLeft <= 30
                                        ? "bg-orange-50 text-orange-700"
                                        : "bg-blue-50 text-blue-700"
                                }`}
                        >
                            <Clock3 size={10} />
                            {daysLeft < 0 ? "Expired" : `${daysLeft} days left`}
                        </div>
                    )}
                </div>

                {/* URGENT ALERT */}
                {isUrgent && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-[11px] font-bold text-red-800">
                                ⚠ {totalPending} tasks pending
                            </p>
                            <p className="mt-0.5 text-[10px] text-red-600">
                                Only {daysLeft} days left! Complete ASAP.
                            </p>
                        </div>
                    </div>
                )}

                {!hasData ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center">
                        <AlertCircle className="mx-auto text-slate-400" size={20} />
                        <p className="mt-2 text-xs text-slate-500">
                            No work targets set yet
                        </p>
                    </div>
                ) : (
                    <>
                        {/* OVERALL PROGRESS */}
                        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Overall
                                </span>
                                <span
                                    className={`text-xs font-bold ${isFullyDone
                                        ? "text-emerald-600"
                                        : overallPct >= 50
                                            ? "text-blue-600"
                                            : "text-amber-600"
                                        }`}
                                >
                                    {overallPct}%
                                </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className={`h-full rounded-full transition-all ${isFullyDone
                                        ? "bg-emerald-500"
                                        : overallPct >= 50
                                            ? "bg-blue-500"
                                            : "bg-amber-500"
                                        }`}
                                    style={{ width: `${overallPct}%` }}
                                />
                            </div>

                            <p className="mt-2 text-center text-[10px] font-medium text-slate-500">
                                {totalCompleted} of {totalTarget} tasks completed
                            </p>
                        </div>

                        {/* WORK ITEMS */}
                        <div className="space-y-2.5">
                            {visibleWorks.map((work) => {
                                const t = Number(work.target || 0);
                                const c = Number(work.completed || 0);
                                const pct = t > 0 ? Math.min(Math.round((c / t) * 100), 100) : 0;
                                const done = t > 0 && c >= t;
                                const remaining = Math.max(t - c, 0);

                                const Icon = work.icon;

                                const colorMap = {
                                    blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
                                    purple: { bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500" },
                                    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
                                    amber: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500" },
                                    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", bar: "bg-cyan-500" },
                                };

                                const theme = colorMap[work.color] || colorMap.blue;

                                return (
                                    <div key={work.label}>
                                        <div className="mb-1 flex items-center gap-2">
                                            <div
                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${theme.bg} ${theme.text}`}
                                            >
                                                <Icon size={13} />
                                            </div>

                                            <div className="flex flex-1 items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {work.label}
                                                </span>
                                                <span
                                                    className={`text-xs font-bold ${done
                                                        ? "text-emerald-600"
                                                        : c > 0
                                                            ? "text-amber-600"
                                                            : "text-slate-400"
                                                        }`}
                                                >
                                                    {c}/{t}
                                                </span>
                                            </div>
                                        </div>

                                        {t > 0 && (
                                            <div className="ml-9 h-1.5 w-full max-w-full overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className={`h-full rounded-full transition-all ${done
                                                        ? "bg-emerald-500"
                                                        : pct >= 50
                                                            ? theme.bar
                                                            : "bg-amber-500"
                                                        }`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}

                                        {remaining > 0 && (
                                            <p className="ml-9 mt-1 text-[10px] font-semibold text-orange-600">
                                                {remaining} pending
                                            </p>
                                        )}

                                        {done && t > 0 && (
                                            <p className="ml-9 mt-1 text-[10px] font-semibold text-emerald-600">
                                                ✅ Completed
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <button
                    onClick={onView}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                    <Eye size={14} />
                    View Full Details
                </button>
            </div>
        </div>
    );
};


/* ======================================================
   STAT CARD
====================================================== */

const StatCard = ({ title, value, icon: Icon, color = "blue" }) => {
    const colorMap = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/20" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/20" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", gradient: "from-amber-500 to-amber-600", shadow: "shadow-amber-500/20" },
        red: { bg: "bg-red-50", text: "text-red-600", gradient: "from-red-500 to-red-600", shadow: "shadow-red-500/20" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", gradient: "from-purple-500 to-purple-600", shadow: "shadow-purple-500/20" },
    };

    const theme = colorMap[color] || colorMap.blue;

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg ${theme.shadow}`}
                >
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
};


/* ======================================================
   ASSIGN SEO MODAL
====================================================== */

const AssignSEOModal = ({ onClose, onSuccess }) => {
    const [clients, setClients] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        client: "",
        plan: "",
        startDate: getTodayInputDate(),
        amount: "",
        notes: "",
    });

    const loadData = async () => {
        try {
            setLoadingData(true);

            const [clientsResponse, plansResponse] = await Promise.all([
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

            setClients(Array.isArray(clientData) ? clientData : []);
            setPlans(Array.isArray(planData) ? planData : []);
        } catch (error) {
            console.error("Failed to load assignment data:", error);
            setClients([]);
            setPlans([]);
            alert(error?.response?.data?.message || "Failed to load clients and SEO plans");
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const selectedPlan = plans.find(
        (plan) => String(plan._id) === String(form.plan)
    );

    useEffect(() => {
        if (selectedPlan) {
            setForm((prev) => ({
                ...prev,
                amount: selectedPlan.price || 0,
            }));
        }
    }, [selectedPlan]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.client) return alert("Please select a client.");
        if (!form.plan) return alert("Please select an SEO plan.");
        if (!form.startDate) return alert("Please select start date.");

        try {
            setLoading(true);

            await assignSEO({
                client: form.client,
                plan: form.plan,
                startDate: form.startDate,
                amount: Number(form.amount || 0),
                notes: form.notes,
            });

            alert("SEO plan assigned successfully.");
            onSuccess();
        } catch (error) {
            console.error("SEO assignment failed:", error);
            alert(error?.response?.data?.message || "Failed to assign SEO plan");
        } finally {
            setLoading(false);
        }
    };

    const activePlans = plans.filter((plan) => plan.isActive === true);

    return (
        <Modal title="Assign SEO Plan" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
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
                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">Client</label>
                            <select
                                required
                                value={form.client}
                                onChange={(e) => handleChange("client", e.target.value)}
                                disabled={loadingData || clients.length === 0}
                                className="input h-11 bg-white"
                            >
                                <option value="">
                                    {loadingData ? "Loading clients..." : clients.length === 0 ? "No clients found" : "Select Client"}
                                </option>
                                {clients.map((client) => (
                                    <option key={client._id} value={client._id}>
                                        {client.clientName || "Unnamed Client"}
                                        {client.companyName ? ` — ${client.companyName}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">SEO Plan</label>
                            <select
                                required
                                value={form.plan}
                                onChange={(e) => handleChange("plan", e.target.value)}
                                disabled={loadingData || activePlans.length === 0}
                                className="input h-11 bg-white"
                            >
                                <option value="">
                                    {loadingData ? "Loading SEO plans..." : activePlans.length === 0 ? "No active SEO plans" : "Select SEO Plan"}
                                </option>
                                {activePlans.map((plan) => (
                                    <option key={plan._id} value={plan._id}>
                                        {plan.name} — ₹{Number(plan.price || 0).toLocaleString("en-IN")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {selectedPlan && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-blue-600">Selected Plan</p>
                                <h4 className="mt-1 text-base font-bold text-slate-900">{selectedPlan.name}</h4>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selectedPlan.durationInDays || 0} days SEO service
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Plan Price</p>
                                <p className="mt-1 text-xl font-bold text-blue-700">
                                    ₹{Number(selectedPlan.price || 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Plan Details
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">Start Date</label>
                            <div className="relative">
                                <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={form.startDate}
                                    onChange={(e) => handleChange("startDate", e.target.value)}
                                    className="input h-11 bg-slate-50 pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-700">SEO Amount</label>
                            <div className="relative">
                                <IndianRupee size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={form.amount}
                                    onChange={(e) => handleChange("amount", e.target.value)}
                                    className="input h-11 bg-slate-50 pl-10 font-semibold"
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="mb-2 block text-xs font-bold text-slate-700">Notes</label>
                    <textarea
                        rows="4"
                        value={form.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        placeholder="Add any important notes about this SEO assignment..."
                        className="input resize-none bg-slate-50"
                    />
                    <p className="mt-1.5 text-right text-[11px] text-slate-400">Optional</p>
                </div>

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
                        disabled={loading || loadingData || clients.length === 0 || activePlans.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={15} className="animate-spin" />
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

const SEODetailsModal = ({ seo, onClose }) => {
    const [details, setDetails] = useState(seo);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("monthly");

    const [showMonthlyForm, setShowMonthlyForm] = useState(false);
    const [editingMonthly, setEditingMonthly] = useState(null);
    const [monthlyLoading, setMonthlyLoading] = useState(false);

    const [showDailyForm, setShowDailyForm] = useState(false);
    const [editingDaily, setEditingDaily] = useState(null);
    const [dailyLoading, setDailyLoading] = useState(false);

    const loadDetails = async () => {
        try {
            setLoading(true);
            const response = await getSEOById(seo._id);
            const data =
                response?.data?.seo ||
                response?.data?.data ||
                response?.data ||
                response?.seo ||
                response;
            setDetails(data || seo);
        } catch (error) {
            console.error("Failed to load SEO details:", error);
            setDetails(seo);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetails();
    }, [seo._id]);

    const handleDeleteMonthly = async (trackingId) => {
        if (!window.confirm("Are you sure you want to delete this monthly tracking?")) return;
        try {
            setMonthlyLoading(true);
            await deleteMonthlyTracking(details._id, trackingId);
            await loadDetails();
        } catch (error) {
            console.error("Delete monthly tracking error:", error);
            alert(error?.response?.data?.message || "Failed to delete monthly tracking");
        } finally {
            setMonthlyLoading(false);
        }
    };

    const handleMonthlySubmit = async (formData) => {
        try {
            setMonthlyLoading(true);
            if (editingMonthly) {
                await updateMonthlyTracking(details._id, editingMonthly._id, formData);
            } else {
                await addMonthlyTracking(details._id, formData);
            }
            setShowMonthlyForm(false);
            setEditingMonthly(null);
            await loadDetails();
        } catch (error) {
            console.error("Monthly tracking error:", error);
            alert(error?.response?.data?.message || "Failed to save monthly tracking");
        } finally {
            setMonthlyLoading(false);
        }
    };

    const handleDeleteDaily = async (trackingId) => {
        if (!window.confirm("Are you sure you want to delete this daily tracking?")) return;
        try {
            setDailyLoading(true);
            await deleteDailyTracking(details._id, trackingId);
            await loadDetails();
        } catch (error) {
            console.error("Delete daily tracking error:", error);
            alert(error?.response?.data?.message || "Failed to delete daily tracking");
        } finally {
            setDailyLoading(false);
        }
    };

    const handleDailySubmit = async (formData) => {
        try {
            setDailyLoading(true);
            if (editingDaily) {
                await updateDailyTracking(details._id, editingDaily._id, formData);
            } else {
                await addDailyTracking(details._id, formData);
            }
            setShowDailyForm(false);
            setEditingDaily(null);
            await loadDetails();
        } catch (error) {
            console.error("Daily tracking error:", error);
            alert(error?.response?.data?.message || "Failed to save daily tracking");
        } finally {
            setDailyLoading(false);
        }
    };

    return (
        <Modal title="SEO Details" onClose={onClose} wide>
            {loading ? (
                <div className="py-16 text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <p className="mt-3 text-sm text-slate-500">Loading SEO details...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/40 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                    SEO Client
                                </p>
                                <h3 className="mt-1 text-xl font-bold text-slate-900">
                                    {details.client?.clientName || "Client"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {details.client?.companyName || details.client?.email || "-"}
                                </p>
                            </div>

                            <div className="lg:text-right">
                                <p className="text-sm font-semibold text-blue-700">
                                    {details.planName || details.plan?.name || "-"}
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-900">
                                    {formatCurrency(details.amount)}
                                </p>
                                <div className="mt-2">{statusBadge(details.status)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <InfoBox label="Start Date" value={formatDateValue(details.startDate)} />
                        <InfoBox label="End Date" value={formatDateValue(details.endDate)} />
                        <InfoBox label="Duration" value={`${details.durationInDays || 0} Days`} />
                        <InfoBox label="Total Amount" value={formatCurrency(details.amount)} />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Target size={17} className="text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900">
                                Overall Work Summary
                            </h3>
                        </div>
                        <DetailsWorkSummary seo={details} />
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                        <button
                            onClick={() => setActiveTab("monthly")}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "monthly" ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            <CalendarDays size={16} />
                            Monthly Tracking
                        </button>

                        <button
                            onClick={() => setActiveTab("daily")}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "daily" ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            <Activity size={16} />
                            Daily Tracking
                        </button>
                    </div>

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
                            onDelete={handleDeleteMonthly}
                            deleting={monthlyLoading}
                        />
                    )}

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
                            onDelete={handleDeleteDaily}
                            deleting={dailyLoading}
                        />
                    )}

                    {showMonthlyForm && (
                        <MonthlyTrackingModal
                            item={editingMonthly}
                            loading={monthlyLoading}
                            onClose={() => {
                                setShowMonthlyForm(false);
                                setEditingMonthly(null);
                            }}
                            onSubmit={handleMonthlySubmit}
                        />
                    )}

                    {showDailyForm && (
                        <DailyTrackingModal
                            item={editingDaily}
                            loading={dailyLoading}
                            onClose={() => {
                                setShowDailyForm(false);
                                setEditingDaily(null);
                            }}
                            onSubmit={handleDailySubmit}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};


/* ======================================================
   DETAILS WORK SUMMARY
====================================================== */

const DetailsWorkSummary = ({ seo }) => {
    const monthlyTracking = seo?.monthlyTracking || [];

    if (monthlyTracking.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
                <Target className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm text-slate-500">No monthly tracking added yet</p>
            </div>
        );
    }

    const totals = monthlyTracking.reduce(
        (acc, item) => {
            acc.blogsTarget += Number(item.blogsTarget || 0);
            acc.blogsCompleted += Number(item.blogsCompleted || 0);
            acc.caseStudiesTarget += Number(item.caseStudiesTarget || 0);
            acc.caseStudiesCompleted += Number(item.caseStudiesCompleted || 0);
            acc.gmbTarget += Number(item.gmbTarget || 0);
            acc.gmbCompleted += Number(item.gmbCompleted || 0);
            acc.keywordsTarget += Number(item.keywordsTarget || 0);
            acc.keywordsCompleted += Number(item.keywordsCompleted || 0);
            acc.backlinksTarget += Number(item.backlinksTarget || 0);
            acc.backlinksCompleted += Number(item.backlinksCompleted || 0);
            acc.onPageTarget += Number(item.onPageTarget || 0);
            acc.onPageCompleted += Number(item.onPageCompleted || 0);
            acc.technicalTarget += Number(item.technicalTarget || 0);
            acc.technicalCompleted += Number(item.technicalCompleted || 0);
            return acc;
        },
        {
            blogsTarget: 0, blogsCompleted: 0,
            caseStudiesTarget: 0, caseStudiesCompleted: 0,
            gmbTarget: 0, gmbCompleted: 0,
            keywordsTarget: 0, keywordsCompleted: 0,
            backlinksTarget: 0, backlinksCompleted: 0,
            onPageTarget: 0, onPageCompleted: 0,
            technicalTarget: 0, technicalCompleted: 0,
        }
    );

    const works = [
        { label: "Blogs", target: totals.blogsTarget, completed: totals.blogsCompleted },
        { label: "Case Studies", target: totals.caseStudiesTarget, completed: totals.caseStudiesCompleted },
        { label: "GMB", target: totals.gmbTarget, completed: totals.gmbCompleted },
        { label: "Keywords", target: totals.keywordsTarget, completed: totals.keywordsCompleted },
        { label: "Backlinks", target: totals.backlinksTarget, completed: totals.backlinksCompleted },
        { label: "On Page", target: totals.onPageTarget, completed: totals.onPageCompleted },
        { label: "Technical", target: totals.technicalTarget, completed: totals.technicalCompleted },
    ];

    const visibleWorks = works.filter((w) => w.target > 0 || w.completed > 0);

    if (visibleWorks.length === 0) {
        return <p className="text-sm text-slate-400 text-center py-4">No work targets set</p>;
    }

    const totalPending = visibleWorks.reduce(
        (sum, w) => sum + Math.max(Number(w.target) - Number(w.completed), 0),
        0
    );

    return (
        <div className="space-y-4">
            {totalPending > 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-orange-50/40 p-4">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-orange-600" />
                    <div>
                        <p className="text-sm font-bold text-orange-800">
                            {totalPending} tasks pending
                        </p>
                        <p className="mt-0.5 text-xs text-orange-600">
                            Complete the pending work to reach monthly targets.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-emerald-50/40 p-4">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                        <p className="text-sm font-bold text-emerald-800">
                            🎉 All targets completed!
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-600">
                            Every SEO work item has reached its target.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleWorks.map((work) => {
                    const t = Number(work.target || 0);
                    const c = Number(work.completed || 0);
                    const pct = t > 0 ? Math.min(Math.round((c / t) * 100), 100) : 0;
                    const done = t > 0 && c >= t;
                    const remaining = Math.max(t - c, 0);

                    return (
                        <div
                            key={work.label}
                            className={`rounded-xl border p-4 transition-all ${done ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/30" : remaining > 0 ? "border-orange-100 bg-gradient-to-br from-orange-50/50 to-white" : "border-slate-200 bg-slate-50/50"}`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-700">{work.label}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${done ? "bg-emerald-100 text-emerald-700" : remaining > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600"}`}>
                                    {done ? "✅ Done" : remaining > 0 ? `${remaining} left` : "—"}
                                </span>
                            </div>

                            <div className="mb-3 flex items-baseline justify-between">
                                <p className="text-2xl font-bold text-slate-800">
                                    {c}
                                    <span className="text-sm font-medium text-slate-400">/{t}</span>
                                </p>
                                <p className={`text-xs font-bold ${done ? "text-emerald-600" : pct >= 50 ? "text-blue-600" : "text-amber-600"}`}>
                                    {pct}%
                                </p>
                            </div>

                            {t > 0 && (
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


/* ======================================================
   MONTHLY TRACKING SECTION
====================================================== */

const MonthlyTrackingSection = ({ details, onAdd, onEdit, onDelete, deleting }) => {
    const tracking = details.monthlyTracking || [];

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Monthly SEO Tracking</h3>
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
                    <CalendarDays className="mx-auto text-slate-400" size={28} />
                    <p className="mt-3 text-sm font-semibold text-slate-700">No monthly tracking added</p>
                    <p className="mt-1 text-xs text-slate-500">Add the first month to start tracking SEO work.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[1350px]">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Month</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Work Progress</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Payment</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Work</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tracking.map((item) => {
                                const total = Number(item.paymentAmount || 0);
                                const paid = Math.min(Math.max(Number(item.paidAmount || 0), 0), Math.max(total, 0));
                                const remaining = Math.max(total - paid, 0);

                                const status = item.paymentStatus || (total <= 0 ? "pending" : paid >= total ? "paid" : paid > 0 ? "partial" : "pending");

                                return (
                                    <tr key={item._id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 align-top">
                                            <p className="font-semibold text-slate-800">{item.month}</p>
                                            <p className="text-xs text-slate-400">{item.year}</p>
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <MonthlyWorkProgress item={item} />
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div className="min-w-[145px] space-y-1.5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[11px] text-slate-400">Total</span>
                                                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(total)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[11px] text-slate-400">Paid</span>
                                                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(paid)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[11px] text-slate-400">Remaining</span>
                                                    <span className={`text-sm font-semibold ${remaining > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                                                        {formatCurrency(remaining)}
                                                    </span>
                                                </div>

                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${status === "paid" ? "bg-emerald-50 text-emerald-700" : status === "partial" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                                                    {status === "paid" ? "Paid" : status === "partial" ? "Partially Paid" : "Unpaid"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                {formatWorkStatus(item.workStatus)}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                <button
                                                    onClick={() => onDelete(item._id)}
                                                    disabled={deleting}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


/* ======================================================
   MONTHLY WORK PROGRESS
====================================================== */

const MonthlyWorkProgress = ({ item }) => {
    const works = [
        { label: "Blogs", target: item.blogsTarget, completed: item.blogsCompleted },
        { label: "Case Studies", target: item.caseStudiesTarget, completed: item.caseStudiesCompleted },
        { label: "GMB", target: item.gmbTarget, completed: item.gmbCompleted },
        { label: "Keywords", target: item.keywordsTarget, completed: item.keywordsCompleted },
        { label: "Backlinks", target: item.backlinksTarget, completed: item.backlinksCompleted },
        { label: "On Page", target: item.onPageTarget, completed: item.onPageCompleted },
        { label: "Technical", target: item.technicalTarget, completed: item.technicalCompleted },
    ];

    const visibleWorks = works.filter((w) => {
        const t = Number(w.target || 0);
        const c = Number(w.completed || 0);
        return t > 0 || c > 0;
    });

    if (visibleWorks.length === 0) {
        return <p className="text-xs text-slate-400">No work targets set</p>;
    }

    return (
        <div className="min-w-[220px] space-y-2">
            {visibleWorks.map((work) => {
                const t = Number(work.target || 0);
                const c = Number(work.completed || 0);
                const pct = t > 0 ? Math.min(Math.round((c / t) * 100), 100) : 0;
                const done = t > 0 && c >= t;
                const remaining = Math.max(t - c, 0);

                return (
                    <div key={work.label}>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-500">{work.label}</span>
                            <span className={`font-bold ${done ? "text-emerald-600" : c > 0 ? "text-amber-600" : "text-slate-500"}`}>
                                {c}/{t}
                            </span>
                        </div>

                        {t > 0 && (
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className={`h-full rounded-full ${done ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}

                        {remaining > 0 && (
                            <p className="mt-0.5 text-[10px] font-semibold text-orange-500">⚠ {remaining} pending</p>
                        )}

                        {done && t > 0 && (
                            <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">✅ Complete</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


/* ======================================================
   MONTHLY TRACKING MODAL
====================================================== */

const MonthlyTrackingModal = ({ item, loading, onClose, onSubmit }) => {
    const [form, setForm] = useState({
        month: item?.month || getCurrentMonth(),
        year: item?.year || new Date().getFullYear(),

        keywordsTarget: item?.keywordsTarget ?? 0,
        keywordsCompleted: item?.keywordsCompleted ?? 0,
        backlinksTarget: item?.backlinksTarget ?? 0,
        backlinksCompleted: item?.backlinksCompleted ?? 0,
        blogsTarget: item?.blogsTarget ?? 0,
        blogsCompleted: item?.blogsCompleted ?? 0,
        onPageTarget: item?.onPageTarget ?? 0,
        onPageCompleted: item?.onPageCompleted ?? 0,
        technicalTarget: item?.technicalTarget ?? 0,
        technicalCompleted: item?.technicalCompleted ?? 0,
        rankingImproved: item?.rankingImproved ?? 0,

        caseStudiesTarget: item?.caseStudiesTarget ?? 0,
        caseStudiesCompleted: item?.caseStudiesCompleted ?? 0,
        gmbTarget: item?.gmbTarget ?? 0,
        gmbCompleted: item?.gmbCompleted ?? 0,
        rankingTarget: item?.rankingTarget ?? 0,

        paymentAmount: item?.paymentAmount ?? 0,
        paidAmount: item?.paidAmount ?? 0,

        workStatus: item?.workStatus || "pending",
        notes: item?.notes || "",
    });

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const totalAmount = Math.max(Number(form.paymentAmount || 0), 0);
    const enteredPaidAmount = Math.max(Number(form.paidAmount || 0), 0);
    const paidAmount = Math.min(enteredPaidAmount, totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

    const paymentStatus = totalAmount <= 0 ? "pending" : paidAmount >= totalAmount ? "paid" : paidAmount > 0 ? "partial" : "pending";

    const paymentStatusLabel = { pending: "Unpaid", partial: "Partially Paid", paid: "Paid" };

    const overallProgress = useMemo(() => {
        const items = [
            { target: Number(form.blogsTarget || 0), completed: Number(form.blogsCompleted || 0) },
            { target: Number(form.caseStudiesTarget || 0), completed: Number(form.caseStudiesCompleted || 0) },
            { target: Number(form.gmbTarget || 0), completed: Number(form.gmbCompleted || 0) },
            { target: Number(form.keywordsTarget || 0), completed: Number(form.keywordsCompleted || 0) },
            { target: Number(form.backlinksTarget || 0), completed: Number(form.backlinksCompleted || 0) },
            { target: Number(form.onPageTarget || 0), completed: Number(form.onPageCompleted || 0) },
            { target: Number(form.technicalTarget || 0), completed: Number(form.technicalCompleted || 0) },
            { target: Number(form.rankingTarget || 0), completed: Number(form.rankingImproved || 0) },
        ];

        const totalTarget = items.reduce((sum, i) => sum + i.target, 0);
        if (totalTarget === 0) return 0;

        const totalCompleted = items.reduce((sum, i) => sum + Math.min(i.completed, i.target), 0);
        return Math.min(Math.round((totalCompleted / totalTarget) * 100), 100);
    }, [form]);

    const submit = (e) => {
        e.preventDefault();

        onSubmit({
            ...form,
            year: Number(form.year),
            keywordsTarget: Number(form.keywordsTarget),
            keywordsCompleted: Number(form.keywordsCompleted),
            backlinksTarget: Number(form.backlinksTarget),
            backlinksCompleted: Number(form.backlinksCompleted),
            blogsTarget: Number(form.blogsTarget),
            blogsCompleted: Number(form.blogsCompleted),
            onPageTarget: Number(form.onPageTarget),
            onPageCompleted: Number(form.onPageCompleted),
            technicalTarget: Number(form.technicalTarget),
            technicalCompleted: Number(form.technicalCompleted),
            rankingImproved: Number(form.rankingImproved),
            caseStudiesTarget: Number(form.caseStudiesTarget),
            caseStudiesCompleted: Number(form.caseStudiesCompleted),
            gmbTarget: Number(form.gmbTarget),
            gmbCompleted: Number(form.gmbCompleted),
            rankingTarget: Number(form.rankingTarget),
            paymentAmount: totalAmount,
            paidAmount: paidAmount,
        });
    };

    return (
        <Modal title={item ? "Edit Monthly Tracking" : "Add Monthly Tracking"} onClose={onClose} wide>
            <form onSubmit={submit} className="space-y-5">

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Tracking Period</h3>
                        <p className="mt-1 text-xs text-slate-500">Select the month and year for this SEO tracking record.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label">Month</label>
                            <select
                                value={form.month}
                                onChange={(e) => handleChange("month", e.target.value)}
                                className="input"
                            >
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Year</label>
                            <input
                                type="number"
                                value={form.year}
                                onChange={(e) => handleChange("year", e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">SEO Work Targets</h3>
                            <p className="mt-1 text-xs text-slate-500">Set monthly target and track completed work.</p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${overallProgress === 100 ? "bg-emerald-100 text-emerald-700" : overallProgress >= 50 ? "bg-blue-100 text-blue-700" : overallProgress > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                            {overallProgress}% Complete
                        </span>
                    </div>

                    <div className="space-y-5 p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <WorkTargetInput label="Blogs" target={form.blogsTarget} completed={form.blogsCompleted} onTargetChange={(v) => handleChange("blogsTarget", v)} onCompletedChange={(v) => handleChange("blogsCompleted", v)} />
                            <WorkTargetInput label="Case Studies" target={form.caseStudiesTarget} completed={form.caseStudiesCompleted} onTargetChange={(v) => handleChange("caseStudiesTarget", v)} onCompletedChange={(v) => handleChange("caseStudiesCompleted", v)} />
                            <WorkTargetInput label="GMB Optimization" target={form.gmbTarget} completed={form.gmbCompleted} onTargetChange={(v) => handleChange("gmbTarget", v)} onCompletedChange={(v) => handleChange("gmbCompleted", v)} />
                            <WorkTargetInput label="Keywords" target={form.keywordsTarget} completed={form.keywordsCompleted} onTargetChange={(v) => handleChange("keywordsTarget", v)} onCompletedChange={(v) => handleChange("keywordsCompleted", v)} />
                            <WorkTargetInput label="Backlinks" target={form.backlinksTarget} completed={form.backlinksCompleted} onTargetChange={(v) => handleChange("backlinksTarget", v)} onCompletedChange={(v) => handleChange("backlinksCompleted", v)} />
                            <WorkTargetInput label="On Page" target={form.onPageTarget} completed={form.onPageCompleted} onTargetChange={(v) => handleChange("onPageTarget", v)} onCompletedChange={(v) => handleChange("onPageCompleted", v)} />
                            <WorkTargetInput label="Technical SEO" target={form.technicalTarget} completed={form.technicalCompleted} onTargetChange={(v) => handleChange("technicalTarget", v)} onCompletedChange={(v) => handleChange("technicalCompleted", v)} />
                            <WorkTargetInput label="Ranking Improved" target={form.rankingTarget} completed={form.rankingImproved} onTargetChange={(v) => handleChange("rankingTarget", v)} onCompletedChange={(v) => handleChange("rankingImproved", v)} />
                        </div>

                        <WorkReminder form={form} overallProgress={overallProgress} />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Payment Details</h3>
                            <p className="mt-1 text-xs text-slate-500">Track total payment, received amount and remaining balance.</p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : paymentStatus === "partial" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                            {paymentStatusLabel[paymentStatus]}
                        </span>
                    </div>

                    <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="label">Total Amount</label>
                                <div className="relative">
                                    <IndianRupee size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.paymentAmount}
                                        onChange={(e) => handleChange("paymentAmount", e.target.value)}
                                        className="input h-11 bg-slate-50 pl-9 font-medium"
                                        placeholder="Enter total amount"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Paid Amount</label>
                                <div className="relative">
                                    <IndianRupee size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    <input
                                        type="number"
                                        min="0"
                                        max={totalAmount}
                                        value={form.paidAmount}
                                        onChange={(e) => handleChange("paidAmount", e.target.value)}
                                        className="input h-11 bg-slate-50 pl-9 font-medium"
                                        placeholder="Enter received amount"
                                    />
                                </div>

                                {enteredPaidAmount > totalAmount && totalAmount > 0 && (
                                    <p className="mt-1.5 text-xs font-medium text-orange-600">Paid amount cannot exceed total amount.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
                                <p className="mt-1 text-lg font-bold text-slate-800">{formatCurrency(totalAmount)}</p>
                            </div>

                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Paid</p>
                                <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(paidAmount)}</p>
                            </div>

                            <div className={`rounded-xl border px-4 py-3.5 ${remainingAmount > 0 ? "border-orange-100 bg-orange-50/60" : "border-emerald-100 bg-emerald-50/60"}`}>
                                <p className={`text-[11px] font-semibold uppercase tracking-wide ${remainingAmount > 0 ? "text-orange-600" : "text-emerald-600"}`}>Remaining</p>
                                <p className={`mt-1 text-lg font-bold ${remainingAmount > 0 ? "text-orange-700" : "text-emerald-700"}`}>{formatCurrency(remainingAmount)}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Payment Status</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">Automatically calculated from paid amount</p>
                            </div>

                            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : paymentStatus === "partial" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>
                                {paymentStatusLabel[paymentStatus]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-3">
                        <label className="label">Work Status</label>
                        <p className="mt-1 text-xs text-slate-500">Current status of this month's SEO work.</p>
                    </div>

                    <select value={form.workStatus} onChange={(e) => handleChange("workStatus", e.target.value)} className="input">
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="label">Notes</label>
                    <p className="mb-3 mt-1 text-xs text-slate-500">Add any important notes about this month's SEO work.</p>

                    <textarea
                        rows="4"
                        value={form.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        placeholder="Monthly SEO work notes..."
                        className="input resize-none"
                    />
                </div>

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
                        {loading ? "Saving..." : item ? "Update Month" : "Add Month"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


/* ======================================================
   WORK TARGET INPUT
====================================================== */

const WorkTargetInput = ({ label, target, completed, onTargetChange, onCompletedChange }) => {
    const targetNum = Math.max(Number(target || 0), 0);
    const completedNum = Math.max(Number(completed || 0), 0);
    const percentage = targetNum > 0 ? Math.min(Math.round((completedNum / targetNum) * 100), 100) : 0;
    const remaining = Math.max(targetNum - completedNum, 0);
    const isComplete = targetNum > 0 && completedNum >= targetNum;
    const isOverTarget = targetNum > 0 && completedNum > targetNum;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">{label}</label>

                {targetNum > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isComplete ? "bg-emerald-100 text-emerald-700" : completedNum > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"}`}>
                        {isComplete ? "✅ Target Done" : `${remaining} left`}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Target</p>
                    <input
                        type="number"
                        min="0"
                        value={target}
                        onChange={(e) => onTargetChange(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Completed</p>
                    <input
                        type="number"
                        min="0"
                        value={completed}
                        onChange={(e) => onCompletedChange(e.target.value)}
                        className="h-9 w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 text-sm font-semibold text-emerald-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
            </div>

            {targetNum > 0 && (
                <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">Progress</span>
                        <span className={`text-[10px] font-bold ${isComplete ? "text-emerald-600" : "text-slate-600"}`}>
                            {completedNum}/{targetNum} ({percentage}%)
                        </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className={`h-full rounded-full transition-all ${isOverTarget ? "bg-blue-500" : isComplete ? "bg-emerald-500" : percentage >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>

                    {isOverTarget && (
                        <p className="mt-1.5 text-[10px] font-semibold text-blue-600">
                            ⚡ Exceeded target by {completedNum - targetNum}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};


/* ======================================================
   WORK REMINDER
====================================================== */

const WorkReminder = ({ form, overallProgress }) => {
    const items = [
        { label: "Blogs", target: form.blogsTarget, completed: form.blogsCompleted },
        { label: "Case Studies", target: form.caseStudiesTarget, completed: form.caseStudiesCompleted },
        { label: "GMB Optimization", target: form.gmbTarget, completed: form.gmbCompleted },
        { label: "Keywords", target: form.keywordsTarget, completed: form.keywordsCompleted },
        { label: "Backlinks", target: form.backlinksTarget, completed: form.backlinksCompleted },
        { label: "On Page", target: form.onPageTarget, completed: form.onPageCompleted },
        { label: "Technical SEO", target: form.technicalTarget, completed: form.technicalCompleted },
        { label: "Ranking", target: form.rankingTarget, completed: form.rankingImproved },
    ];

    const pending = items.filter((i) => {
        const t = Number(i.target || 0);
        const c = Number(i.completed || 0);
        return t > 0 && c < t;
    });

    const completedItems = items.filter((i) => {
        const t = Number(i.target || 0);
        const c = Number(i.completed || 0);
        return t > 0 && c >= t;
    });

    if (pending.length === 0 && completedItems.length === 0) return null;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Target size={15} className="text-blue-600" />
                <p className="text-xs font-bold text-slate-700">Reminders</p>
                {overallProgress === 100 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        🎉 All Targets Done
                    </span>
                )}
            </div>

            {pending.length > 0 && (
                <div className="mb-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-orange-600">⚠️ Pending Work</p>
                    <div className="flex flex-wrap gap-1.5">
                        {pending.map((item) => (
                            <span key={item.label} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                                {item.label}: {Number(item.target) - Number(item.completed)} left
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {completedItems.length > 0 && (
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600">✅ Completed</p>
                    <div className="flex flex-wrap gap-1.5">
                        {completedItems.map((item) => (
                            <span key={item.label} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {item.label}: {item.completed}/{item.target}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


/* ======================================================
   DAILY TRACKING SECTION
====================================================== */

const DailyTrackingSection = ({ details, onAdd, onEdit, onDelete, deleting }) => {
    const dailyTracking = details.dailyTracking || [];

    const sortedTracking = [...dailyTracking].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Daily SEO Tracking</h3>
                    <p className="mt-1 text-sm text-slate-500">Track the actual SEO work performed each day.</p>
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
                    <Activity className="mx-auto text-slate-400" size={28} />
                    <p className="mt-3 text-sm font-semibold text-slate-700">No daily tracking added</p>
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
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Keywords</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Backlinks</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Blogs</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">On Page</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Technical</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedTracking.map((item) => (
                                <tr key={item._id} className="border-t border-slate-100">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-800">{formatDateValue(item.date)}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{item.keywordsCompleted ?? 0}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{item.backlinksCompleted ?? 0}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{item.blogsCompleted ?? 0}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{item.onPageCompleted ?? 0}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{item.technicalCompleted ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.workStatus === "completed" ? "bg-emerald-50 text-emerald-700" : item.workStatus === "in-progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                            {formatWorkStatus(item.workStatus)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>

                                            <button
                                                onClick={() => onDelete(item._id)}
                                                disabled={deleting}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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

const DailyTrackingModal = ({ item, loading, onClose, onSubmit }) => {
    const [form, setForm] = useState({
        date: getDateInputValue(item?.date),
        keywordsCompleted: item?.keywordsCompleted ?? 0,
        backlinksCompleted: item?.backlinksCompleted ?? 0,
        blogsCompleted: item?.blogsCompleted ?? 0,
        onPageCompleted: item?.onPageCompleted ?? 0,
        technicalCompleted: item?.technicalCompleted ?? 0,
        workStatus: item?.workStatus || "pending",
        notes: item?.notes || "",
    });

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const submit = (e) => {
        e.preventDefault();

        if (!form.date) {
            alert("Please select a date.");
            return;
        }

        onSubmit({
            date: form.date,
            keywordsCompleted: Number(form.keywordsCompleted),
            backlinksCompleted: Number(form.backlinksCompleted),
            blogsCompleted: Number(form.blogsCompleted),
            onPageCompleted: Number(form.onPageCompleted),
            technicalCompleted: Number(form.technicalCompleted),
            workStatus: form.workStatus,
            notes: form.notes,
        });
    };

    return (
        <Modal title={item ? "Edit Daily Tracking" : "Add Daily Tracking"} onClose={onClose}>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="label">Date</label>
                    <input
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        className="input"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">Date must be within the SEO plan duration.</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                        <Activity size={17} className="text-blue-600" />
                        Daily SEO Work
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <MetricInput label="Keywords Completed" value={form.keywordsCompleted} onChange={(v) => handleChange("keywordsCompleted", v)} />
                        <MetricInput label="Backlinks Completed" value={form.backlinksCompleted} onChange={(v) => handleChange("backlinksCompleted", v)} />
                        <MetricInput label="Blogs Completed" value={form.blogsCompleted} onChange={(v) => handleChange("blogsCompleted", v)} />
                        <MetricInput label="On Page Completed" value={form.onPageCompleted} onChange={(v) => handleChange("onPageCompleted", v)} />
                        <MetricInput label="Technical Completed" value={form.technicalCompleted} onChange={(v) => handleChange("technicalCompleted", v)} />
                    </div>
                </div>

                <div>
                    <label className="label">Work Status</label>
                    <select
                        value={form.workStatus}
                        onChange={(e) => handleChange("workStatus", e.target.value)}
                        className="input"
                    >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div>
                    <label className="label">Daily Notes</label>
                    <textarea
                        rows="4"
                        maxLength="1000"
                        value={form.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        placeholder="What work was completed today?"
                        className="input resize-none"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">{form.notes.length}/1000</p>
                </div>

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
                        {loading ? "Saving..." : item ? "Update Day" : "Add Day"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


/* ======================================================
   METRIC INPUT
====================================================== */

const MetricInput = ({ label, value, onChange }) => {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input"
            />
        </div>
    );
};


/* ======================================================
   INFO BOX
====================================================== */

const InfoBox = ({ label, value }) => {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
        </div>
    );
};


/* ======================================================
   MODAL
====================================================== */

const Modal = ({ title, children, onClose, wide = false }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
            <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-7xl" : "max-w-xl"}`}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        ×
                    </button>
                </div>

                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};


/* ======================================================
   HELPERS
====================================================== */

const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const formatDateValue = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getTodayInputDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getDateInputValue = (value) => {
    if (!value) return getTodayInputDate();

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return getTodayInputDate();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getCurrentMonth = () => {
    return new Date().toLocaleString("en-US", { month: "long" });
};

const formatWorkStatus = (status) => {
    if (status === "in-progress") return "In Progress";
    if (status === "completed") return "Completed";
    return "Pending";
};

const statusBadge = (status) => {
    if (status === "active") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Active
            </span>
        );
    }

    if (status === "expired") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Expired
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Cancelled
        </span>
    );
};


export default SEO;
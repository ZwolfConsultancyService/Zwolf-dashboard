import { useEffect, useState } from 'react';
import {
    BookOpen,
    UserRound,
    CalendarDays,
    ArrowUpRight,
    Copy,
    Check,
} from 'lucide-react';
import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function DeveloperGuides() {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        api
            .get('/guides', { params: { limit: 100 } })
            .then((res) => setGuides(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleCopy = async (id, description) => {
        try {
            await navigator.clipboard.writeText(description || '');

            setCopiedId(id);

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy description:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <BookOpen size={22} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Guides
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Manager ki taraf se guides aur instructions
                            </p>
                        </div>
                    </div>
                </div>

                {!loading && guides.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                        <p className="text-xs font-medium text-gray-400">
                            Total Guides
                        </p>

                        <p className="mt-0.5 text-lg font-bold text-gray-900">
                            {guides.length}
                        </p>
                    </div>
                )}
            </div>

            {/* Content */}

            {/* Content */}
            <Card>
                <div className="p-5 sm:p-6">
                    {loading ? (
                        <div className="flex min-h-[240px] items-center justify-center">
                            <Loader />
                        </div>
                    ) : guides.length === 0 ? (
                        <div className="py-10">
                            <EmptyState
                                title="No guides yet"
                                message="Manager ne abhi tak koi guide nahi bheja"
                            />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {guides.map((g) => {
                                const isCopied = copiedId === g._id;

                                return (
                                    <div
                                        key={g._id}
                                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:p-6"
                                    >
                                        {/* Top Section */}
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                                <BookOpen size={22} />
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="break-words text-lg font-semibold text-gray-900">
                                                            {g.title}
                                                        </h3>

                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Guide / Instruction
                                                        </p>
                                                    </div>

                                                    <ArrowUpRight
                                                        size={19}
                                                        className="mt-1 shrink-0 text-gray-300 transition-colors group-hover:text-blue-600"
                                                    />
                                                </div>

                                                {/* Divider */}
                                                <div className="my-4 h-px bg-gray-100" />

                                                {/* Description */}
                                                <div>
                                                    <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-50 p-3 scrollbar-thin"> <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-600"> {g.description} </p> </div>

                                                    {/* Copy Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopy(g._id, g.description)
                                                        }
                                                        className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${isCopied
                                                                ? 'border-green-200 bg-green-50 text-green-600'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                                                            }`}
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <Check size={14} />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={14} />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <UserRound
                                                    size={14}
                                                    className="text-gray-400"
                                                />

                                                <span>
                                                    By{' '}
                                                    <span className="font-medium text-gray-700">
                                                        {g.createdBy?.name || 'Manager'}
                                                    </span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <CalendarDays
                                                    size={14}
                                                    className="text-gray-400"
                                                />

                                                <span>{formatDateTime(g.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>

        </div>
    );
}

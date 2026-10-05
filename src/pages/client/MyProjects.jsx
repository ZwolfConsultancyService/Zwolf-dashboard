import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowRight,
  CalendarDays,
  BriefcaseBusiness,
  Search,
  Filter,
} from 'lucide-react';

import api from '../../api/axios.js';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

/* =========================================================
   MY PROJECTS PAGE (Client)
========================================================= */

export default function MyProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // 'all' | 'active' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data } = await api.get('/client-portal/projects', {
          params: {
            page: 1,
            limit: 100,
          },
        });

        const projectData = data?.data;

        if (Array.isArray(projectData)) {
          setProjects(projectData);
        } else if (Array.isArray(projectData?.data)) {
          setProjects(projectData.data);
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error('my projects err:', err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* =========================================================
     FILTER + SEARCH
  ========================================================= */

  const filtered = projects.filter((p) => {
    /* Filter tab */
    if (filter === 'active') {
      if (['Completed', 'Cancelled'].includes(p.status)) return false;
    } else if (filter === 'completed') {
      if (p.status !== 'Completed') return false;
    } else if (filter === 'cancelled') {
      if (p.status !== 'Cancelled') return false;
    }

    /* Search */
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (p.projectName || '').toLowerCase();
      const tech = (p.technology || '').toLowerCase();
      if (!name.includes(q) && !tech.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Projects
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            All projects assigned to your account.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FolderKanban size={16} />
          <span>{projects.length} project(s)</span>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              bg-white
              py-2
              pl-9
              pr-3
              text-sm
              focus:border-blue-500
              focus:outline-none
              focus:ring-1
              focus:ring-blue-500
            "
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 sm:border-0">
          <FilterTabs active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <Loader text="Loading projects..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <FolderKanban size={40} className="mx-auto text-gray-300" />

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            {projects.length === 0
              ? 'No projects yet'
              : 'No projects found'}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {projects.length === 0
              ? 'Projects assigned to your account will appear here.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onOpen={() =>
                navigate(`/client/projects/${project._id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FILTER TABS
========================================================= */

function FilterTabs({ active, onChange }) {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="flex">
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`
              relative
              px-4
              py-3
              text-sm
              font-medium
              transition
              ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}

            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   PROJECT CARD
========================================================= */

function ProjectCard({ project, onOpen }) {
  const progress = Math.min(
    100,
    Math.max(0, Number(project.progress || 0))
  );

  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition
        hover:shadow-md
      "
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* LEFT */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {project.projectName || 'Untitled Project'}
              </h3>

              {project.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {project.description}
                </p>
              )}

              {/* BADGES */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge color={statusColor(project.status)}>
                  {project.status}
                </Badge>

                {project.priority && (
                  <Badge color={statusColor(project.priority)}>
                    {project.priority}
                  </Badge>
                )}

                {project.technology && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {project.technology}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="w-full lg:w-[240px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Progress
            </span>

            <span className="text-sm font-bold text-blue-600">
              {progress}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* DEADLINE */}
        <div className="flex items-center gap-2 lg:w-[140px]">
          <CalendarDays size={16} className="text-gray-400" />

          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Deadline
            </p>

            <p className="text-sm font-medium text-gray-700">
              {project.deadline
                ? formatDate(project.deadline)
                : '—'}
            </p>
          </div>
        </div>

        {/* ACTION */}
        <button
          type="button"
          onClick={onOpen}
          className="
            inline-flex
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-xs
            font-semibold
            text-gray-700
            shadow-sm
            transition
            hover:border-blue-200
            hover:bg-blue-50
            hover:text-blue-600
          "
        >
          View Project
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
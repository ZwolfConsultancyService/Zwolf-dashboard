import { useEffect, useState } from 'react';
import {
  Search,
  Package,
  Tag,
  IndianRupee,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Loader from '../../components/ui/Loader.jsx';

const CATEGORIES = [
  'Custom Software',
  'Web Application',
  'Mobile App',
  'CRM',
  'ERP',
  'E-commerce',
  'SaaS',
  'Website',
  'UI/UX Design',
  'Digital Marketing',
  'SEO',
  'Other',
];

/* =========================================================
   🆕 CATEGORY → DEFAULT IMAGE MAP
   
   Use ImageKit CDN / public images
========================================================= */

const CATEGORY_IMAGES = {
  'Custom Software':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  'Web Application':
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
  'Mobile App':
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  CRM:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  ERP:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'E-commerce':
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  SaaS:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  Website:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80',
  'UI/UX Design':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  'Digital Marketing':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  SEO:
    'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=800&q=80',
  Other:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
};

/* 🆕 Default fallback */
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';

/* 🆕 Helper — get image URL */
const getProductImage = (product) => {
  if (product.image && product.image.trim()) {
    return product.image;
  }
  return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
};

export default function ClientProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    setLoading(true);

    try {
      const params = { page: 1, limit: 100 };
      if (search) params.search = search;
      if (category) params.category = category;

      const { data } = await api.get('/products', { params });
      setProducts(data.data || []);
    } catch (err) {
      console.error('products err:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, category]);

  const filtered = products.filter((p) => p.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Package size={21} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Our Products
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Explore our software solutions and services.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <Loader text="Loading products..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center">
          <Package size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-700">
            No products available
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Products will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT CARD (Client view)
========================================================= */

function ProductCard({ product }) {
  /* 🆕 Get image — product image OR category default */
  const imageUrl = getProductImage(product);

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGE;
          }}
        />

        {/* 🆕 Category badge overlay */}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 shadow-sm backdrop-blur">
            {product.category}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Category Badge */}
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            {product.category}
          </span>
        </div>

        {/* Name */}
        <h3 className="mt-2 text-lg font-bold text-gray-900">
          {product.name}
        </h3>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {product.shortDescription}
          </p>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {product.features.slice(0, 3).map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <CheckCircle2
                  size={13}
                  className="shrink-0 text-green-500"
                />
                <span className="truncate">{f}</span>
              </div>
            ))}
            {product.features.length > 3 && (
              <p className="text-xs font-medium text-blue-600">
                +{product.features.length - 3} more features
              </p>
            )}
          </div>
        )}

        {/* Tech Stack */}
        {product.technology && product.technology.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.technology.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1">
            <IndianRupee size={14} className="text-green-600" />
            <span className="text-base font-bold text-green-600">
              {product.startingPrice
                ? `${Number(product.startingPrice).toLocaleString('en-IN')}+`
                : 'Custom'}
            </span>
          </div>

          {product.deliveryTime && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              {product.deliveryTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
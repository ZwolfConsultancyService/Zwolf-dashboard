import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Tag,
  IndianRupee,
  Clock,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Send,
  Layers,
  FileText,
  Phone,
  Mail,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Loader from '../../components/ui/Loader.jsx';

/* =========================================================
   CATEGORY → DEFAULT IMAGE MAP
========================================================= */

const CATEGORY_IMAGES = {
  'Custom Software':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80',
  'Web Application':
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1600&q=80',
  'Mobile App':
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=80',
  CRM:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80',
  ERP:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
  'E-commerce':
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80',
  SaaS:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80',
  Website:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80',
  'UI/UX Design':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1600&q=80',
  'Digital Marketing':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80',
  SEO:
    'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=1600&q=80',
  Other:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80';

const getProductImage = (product) => {
  if (product?.image && product.image.trim()) {
    return product.image;
  }
  return CATEGORY_IMAGES[product?.category] || DEFAULT_IMAGE;
};

/* =========================================================
   🆕 DEFAULT BENEFITS PER CATEGORY
========================================================= */

const CATEGORY_BENEFITS = {
  'Custom Software': [
    'Tailored to your exact business needs',
    'Scalable architecture for future growth',
    'Full source code ownership',
    'Dedicated development team',
  ],
  'Web Application': [
    'Modern responsive design',
    'Fast and SEO friendly',
    'Cross-browser compatible',
    'Hosting & deployment support',
  ],
  'Mobile App': [
    'Native iOS & Android apps',
    'Offline support & push notifications',
    'App Store & Play Store publishing',
    'Post-launch maintenance',
  ],
  CRM: [
    'Lead & customer management',
    'Sales pipeline tracking',
    'Reports & analytics dashboard',
    'Email & WhatsApp integration',
  ],
  ERP: [
    'Inventory & order management',
    'Finance & accounting modules',
    'HR & payroll management',
    'Custom reports and insights',
  ],
  'E-commerce': [
    'Product catalog & cart',
    'Secure payment gateway',
    'Order tracking system',
    'Admin dashboard',
  ],
  SaaS: [
    'Multi-tenant architecture',
    'Subscription billing',
    'User management & roles',
    'API integrations',
  ],
  Website: [
    'Mobile-first responsive design',
    'SEO optimized',
    'Fast page load speed',
    'CMS for easy updates',
  ],
  'UI/UX Design': [
    'User research & wireframes',
    'Interactive prototypes',
    'Modern visual design',
    'Design system & guidelines',
  ],
  'Digital Marketing': [
    'Social media strategy',
    'Content marketing plan',
    'Paid ad campaigns',
    'Monthly performance reports',
  ],
  SEO: [
    'On-page & off-page SEO',
    'Keyword research & optimization',
    'Technical SEO audit',
    'Monthly ranking reports',
  ],
  Other: [
    'Custom solution tailored for you',
    'Dedicated support team',
    'Quality delivery',
    'Ongoing maintenance',
  ],
};

/* =========================================================
   CLIENT PRODUCT DETAIL PAGE
========================================================= */

export default function ClientProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Enquiry modal */
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data);
      } catch (err) {
        console.error('product load err:', err);
        toastError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, toastError]);

  /* =========================================================
     SUBMIT ENQUIRY
  ========================================================= */

  const submitEnquiry = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toastError('Please enter your message');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/client-requests/send', {
        type: 'project',
        title: `Product Enquiry: ${product.name}`,
        description: message.trim(),
        budget: product.startingPrice
          ? `₹${Number(product.startingPrice).toLocaleString('en-IN')}+`
          : '',
      });

      success('Enquiry sent! Our team will contact you soon.');
      setEnquiryOpen(false);
      setMessage('');
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to send enquiry'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <Loader text="Loading product..." />;
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!product) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Package size={40} className="mx-auto text-gray-300" />

        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          Product not found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          This product may have been removed.
        </p>

        <Button
          onClick={() => navigate('/client/products')}
          className="mt-4 rounded-xl"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Button>
      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  const imageUrl = getProductImage(product);

  /* 🆕 Benefits list (category default or nothing) */
  const benefits =
    CATEGORY_BENEFITS[product.category] || CATEGORY_BENEFITS.Other;

  return (
    <div className="space-y-6">
      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={() => navigate('/client/products')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 lg:h-auto">
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = DEFAULT_IMAGE;
              }}
            />

            {/* Category badge */}
            <div className="absolute left-4 top-4">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 shadow-sm backdrop-blur">
                {product.category}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                {product.category}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 lg:text-3xl">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {product.shortDescription}
              </p>
            )}

            {/* Price + Delivery Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-gray-100 py-5">
              {/* Price */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Starting Price
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <IndianRupee
                    size={16}
                    className="text-green-600"
                  />
                  <span className="text-2xl font-bold text-green-600">
                    {product.startingPrice
                      ? `${Number(product.startingPrice).toLocaleString('en-IN')}`
                      : 'Custom'}
                  </span>
                </div>
                {product.startingPrice > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    (starting from)
                  </p>
                )}
                {product.priceType && (
                  <p className="mt-0.5 text-xs font-medium text-gray-600">
                    {product.priceType} pricing
                  </p>
                )}
              </div>

              {/* Delivery */}
              {product.deliveryTime && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Delivery Time
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-base font-semibold text-gray-800">
                      {product.deliveryTime}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick badges */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Sparkles size={12} />
                {product.features?.length || 0} Features
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                <Layers size={12} />
                {product.technology?.length || 0} Technologies
              </span>
            </div>

            {/* 🆕 Actions — Enquire Now */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setEnquiryOpen(true)}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_4px_12px_rgba(37,99,235,0.25)]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-blue-700
                  hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]
                "
              >
                <MessageSquare size={16} />
                Enquire Now
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/client/messages')}
                className="rounded-xl px-6 py-3"
              >
                <Phone size={15} />
                Contact Team
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          WHAT WE PROVIDE (DESCRIPTION)
      ===================================================== */}
      {product.description && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">
                What We Provide
              </h2>
            </div>
          </div>
          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {product.description}
            </p>
          </div>
        </Card>
      )}

      {/* =====================================================
          🆕 WHAT YOU GET (BENEFITS)
      ===================================================== */}
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">
              What You Get
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>

                <p className="mt-1 text-sm font-medium text-gray-800">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* =====================================================
          FEATURES
      ===================================================== */}
      {product.features && product.features.length > 0 && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Key Features
                </h2>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {product.features.length}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {product.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <CheckCircle2 size={16} />
                  </div>

                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* =====================================================
          TECHNOLOGY STACK
      ===================================================== */}
      {product.technology && product.technology.length > 0 && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-purple-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Built With
                </h2>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {product.technology.length}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {product.technology.map((tech, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* =====================================================
          ENQUIRY MODAL
      ===================================================== */}
      <Modal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        title="Enquire About This Product"
      >
        <form onSubmit={submitEnquiry} className="space-y-4">
          {/* Product summary */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-white">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {product.category}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Your Message *
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your requirements, budget, timeline..."
              required
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEnquiryOpen(false)}
              disabled={submitting}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={submitting}
              className="rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Send size={14} />
              Send Enquiry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  FolderKanban,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Building2,
  CalendarDays,
  UserRound,
  BriefcaseBusiness,
  FileText,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';

import { formatCurrency, formatDate } from '../../utils/format.js';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [payModal, setPayModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    notes: '',
    paymentDate: '',
  });

  const [noteText, setNoteText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [c, p, pr] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/payments/client/${id}`),
        api.get('/projects', { params: { limit: 100 } }),
      ]);

      setClient(c.data.data);
      setPayments(p.data.data);

      setProjects(
        pr.data.data.filter(
          (x) => x.client?._id === id || x.client === id
        )
      );
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load client'
      );
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/payments', {
        ...payForm,
        client: id,
      });

      success('Payment added');
      setPayModal(false);

      setPayForm({
        amount: '',
        paymentMethod: 'UPI',
        transactionId: '',
        notes: '',
        paymentDate: '',
      });

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to add payment'
      );
    } finally {
      setSaving(false);
    }
  };

  const submitNote = async (e) => {
    e.preventDefault();

    if (!noteText.trim()) return;

    setSaving(true);

    try {
      await api.post(`/clients/${id}/notes`, {
        text: noteText,
      });

      success('Note added');
      setNoteModal(false);
      setNoteText('');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to add note'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!client) return null;

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
      ">
        <div className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">

          <div className="flex min-w-0 items-center gap-3">

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="
                shrink-0
                rounded-xl
                border-gray-200
                px-3
                shadow-sm
                transition-all
                duration-200
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
              "
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">
                Back
              </span>
            </Button>

            <div className="
              flex
              min-w-0
              items-center
              gap-3
            ">

              <div className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              ">
                <UserRound size={21} />
              </div>

              <div className="min-w-0">

                <h1 className="
                  truncate
                  text-xl
                  font-bold
                  tracking-tight
                  text-gray-900
                  sm:text-2xl
                ">
                  {client.clientName}
                </h1>

                <div className="
                  mt-1
                  flex
                  flex-wrap
                  items-center
                  gap-x-2
                  gap-y-1
                  text-sm
                  text-gray-500
                ">
                  <span>
                    {client.companyName || 'Individual Client'}
                  </span>

                  <span className="text-gray-300">
                    •
                  </span>

                  <Badge color={statusColor(client.clientStatus)}>
                    {client.clientStatus}
                  </Badge>
                </div>

              </div>

            </div>

          </div>


          {/* Actions */}
          <div className="
            flex
            flex-col
            gap-2
            sm:flex-row
          ">

            <Button
              onClick={() => setPayModal(true)}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-[0_4px_12px_rgba(37,99,235,0.18)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-[0_6px_18px_rgba(37,99,235,0.25)]
                focus:outline-none
                focus:ring-4
                focus:ring-blue-500/20
              "
            >
              <Wallet size={17} />
              Add Payment
            </Button>

            <Button
              variant="outline"
              onClick={() => setNoteModal(true)}
              className="
                rounded-xl
                border-gray-200
                px-5
                py-2.5
                font-semibold
                transition-all
                duration-200
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
              "
            >
              <MessageSquare size={17} />
              Add Note
            </Button>

          </div>

        </div>
      </div>


      {/* =====================================================
          CLIENT + FINANCIAL SUMMARY
      ===================================================== */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Client Information */}
        <Card className="xl:col-span-2">

          <div className="
            border-b
            border-gray-100
            px-5
            py-4
          ">
            <div className="flex items-center gap-3">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
              ">
                <UserRound size={18} />
              </div>

              <div>
                <h2 className="
                  text-base
                  font-semibold
                  text-gray-900
                ">
                  Client Information
                </h2>

                <p className="
                  mt-0.5
                  text-xs
                  text-gray-500
                ">
                  Contact and client details
                </p>
              </div>

            </div>
          </div>


          <div className="p-5">

            <div className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
            ">

              <Info
                icon={Mail}
                label="Email"
                value={client.email}
              />

              <Info
                icon={Phone}
                label="Phone"
                value={client.phone}
              />

              <Info
                icon={Phone}
                label="Alternate Phone"
                value={client.alternatePhone}
              />

              <Info
                icon={MapPin}
                label="City"
                value={client.city}
              />

              <Info
                icon={MapPin}
                label="State"
                value={client.state}
              />

              <Info
                icon={BriefcaseBusiness}
                label="Service Required"
                value={client.serviceRequired}
              />

              <Info
                icon={UserRound}
                label="Assigned Sales"
                value={client.assignedSales?.name}
              />

              <Info
                icon={CalendarDays}
                label="Follow-up Date"
                value={formatDate(client.followUpDate)}
              />

            </div>


            {/* Address */}
            <div className="mt-5">
              <Info
                icon={MapPin}
                label="Address"
                value={client.address}
                full
              />
            </div>


            {/* Description */}
            <div className="mt-4">
              <Info
                icon={FileText}
                label="Description"
                value={client.description}
                full
              />
            </div>


            {/* Status */}
            <div className="
              mt-4
              rounded-xl
              border
              border-gray-100
              bg-gray-50/70
              p-4
            ">
              <p className="
                text-[11px]
                font-semibold
                uppercase
                tracking-wide
                text-gray-400
              ">
                Client Status
              </p>

              <div className="mt-2">
                <Badge color={statusColor(client.clientStatus)}>
                  {client.clientStatus}
                </Badge>
              </div>
            </div>

          </div>

        </Card>


        {/* Financials */}
        <Card>

          <div className="
            border-b
            border-gray-100
            px-5
            py-4
          ">
            <div className="flex items-center gap-3">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-green-50
                text-green-600
              ">
                <CreditCard size={18} />
              </div>

              <div>
                <h2 className="
                  text-base
                  font-semibold
                  text-gray-900
                ">
                  Financials
                </h2>

                <p className="
                  mt-0.5
                  text-xs
                  text-gray-500
                ">
                  Payment overview
                </p>
              </div>

            </div>
          </div>


          <div className="space-y-3 p-5">

            <FinancialRow
              label="Total Amount"
              value={formatCurrency(client.totalAmount)}
              icon={Wallet}
            />

            <FinancialRow
              label="Total Paid"
              value={formatCurrency(client.totalPaid)}
              color="green"
              icon={CheckCircle2}
            />

            <FinancialRow
              label="Remaining"
              value={formatCurrency(client.remainingAmount)}
              color="red"
              icon={Wallet}
            />

          </div>

        </Card>

      </div>


      {/* =====================================================
          PAYMENT HISTORY
      ===================================================== */}
      <Card>

        <div className="
          border-b
          border-gray-100
          px-5
          py-4
        ">
          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <div className="flex items-center gap-3">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-green-50
                text-green-600
              ">
                <Wallet size={18} />
              </div>

              <div>
                <h2 className="
                  text-base
                  font-semibold
                  text-gray-900
                ">
                  Payment History
                </h2>

                <p className="
                  mt-0.5
                  text-xs
                  text-gray-500
                ">
                  All payments received from this client
                </p>
              </div>

            </div>

            <span className="
              w-fit
              rounded-full
              bg-gray-100
              px-2.5
              py-1
              text-xs
              font-semibold
              text-gray-600
            ">
              {payments.length} Payments
            </span>

          </div>
        </div>


        <div className="p-5">

          {payments.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              border-gray-200
              bg-gray-50/60
              px-5
              py-10
              text-center
            ">
              <Wallet
                size={24}
                className="mx-auto text-gray-400"
              />

              <p className="
                mt-3
                text-sm
                font-semibold
                text-gray-700
              ">
                No payments yet
              </p>

              <p className="
                mt-1
                text-xs
                text-gray-500
              ">
                Payment records will appear here.
              </p>
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px]">

                <thead>
                  <tr className="
                    border-b
                    border-gray-200
                    bg-gray-50/70
                  ">

                    <th className="
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    ">
                      Date
                    </th>

                    <th className="
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    ">
                      Amount
                    </th>

                    <th className="
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    ">
                      Method
                    </th>

                    <th className="
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    ">
                      Transaction ID
                    </th>

                    <th className="
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    ">
                      Added By
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {payments.map((p) => (

                    <tr
                      key={p._id}
                      className="
                        transition-colors
                        duration-150
                        hover:bg-gray-50/70
                      "
                    >

                      <td className="
                        px-4
                        py-3.5
                        text-sm
                        font-medium
                        text-gray-700
                      ">
                        {formatDate(p.paymentDate)}
                      </td>

                      <td className="
                        px-4
                        py-3.5
                        text-sm
                        font-semibold
                        text-green-600
                      ">
                        {formatCurrency(p.amount)}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge>
                          {p.paymentMethod}
                        </Badge>
                      </td>

                      <td className="
                        px-4
                        py-3.5
                        text-sm
                        text-gray-500
                      ">
                        {p.transactionId || '—'}
                      </td>

                      <td className="
                        px-4
                        py-3.5
                        text-sm
                        font-medium
                        text-gray-700
                      ">
                        {p.createdBy?.name || '—'}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </Card>


      {/* =====================================================
          PROJECTS
      ===================================================== */}
      <Card>

        <div className="
          border-b
          border-gray-100
          px-5
          py-4
        ">
          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <div className="flex items-center gap-3">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
              ">
                <FolderKanban size={18} />
              </div>

              <div>
                <h2 className="
                  text-base
                  font-semibold
                  text-gray-900
                ">
                  Client Projects
                </h2>

                <p className="
                  mt-0.5
                  text-xs
                  text-gray-500
                ">
                  Projects associated with this client
                </p>
              </div>

            </div>

            <span className="
              w-fit
              rounded-full
              bg-gray-100
              px-2.5
              py-1
              text-xs
              font-semibold
              text-gray-600
            ">
              {projects.length} Projects
            </span>

          </div>
        </div>


        <div className="p-5">

          {projects.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              border-gray-200
              bg-gray-50/60
              px-5
              py-10
              text-center
            ">

              <FolderKanban
                size={24}
                className="mx-auto text-gray-400"
              />

              <p className="
                mt-3
                text-sm
                font-semibold
                text-gray-700
              ">
                No projects for this client
              </p>

              <p className="
                mt-1
                text-xs
                text-gray-500
              ">
                Associated projects will appear here.
              </p>

            </div>

          ) : (

            <div className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
            ">

              {projects.map((p) => (

                <button
                  key={p._id}
                  type="button"
                  onClick={() =>
                    navigate(`/${user.role}/projects/${p._id}`)
                  }
                  className="
                    group
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-4
                    text-left
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:border-blue-200
                    hover:shadow-md
                  "
                >

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  ">

                    <div className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                    ">

                      <div className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-50
                        text-blue-600
                        transition-colors
                        group-hover:bg-blue-100
                      ">
                        <FolderKanban size={17} />
                      </div>

                      <div className="min-w-0">

                        <p className="
                          truncate
                          text-sm
                          font-semibold
                          text-gray-900
                          transition-colors
                          group-hover:text-blue-600
                        ">
                          {p.projectName}
                        </p>

                        <p className="
                          mt-0.5
                          text-xs
                          text-gray-500
                        ">
                          {p.technology || 'Technology not specified'}
                        </p>

                      </div>

                    </div>

                    <Badge color={statusColor(p.status)}>
                      {p.status}
                    </Badge>

                  </div>


                  {/* Progress */}
                  <div className="mt-4">

                    <div className="
                      mb-1.5
                      flex
                      items-center
                      justify-between
                    ">
                      <span className="
                        text-xs
                        font-medium
                        text-gray-500
                      ">
                        Progress
                      </span>

                      <span className="
                        text-xs
                        font-semibold
                        text-blue-600
                      ">
                        {p.progress || 0}%
                      </span>
                    </div>

                    <div className="
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-gray-100
                    ">
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-blue-600
                          transition-all
                          duration-500
                        "
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, p.progress || 0)
                          )}%`,
                        }}
                      />
                    </div>

                  </div>

                </button>

              ))}

            </div>

          )}

        </div>

      </Card>


      {/* =====================================================
          NOTES
      ===================================================== */}
      <Card>

        <div className="
          border-b
          border-gray-100
          px-5
          py-4
        ">
          <div className="flex items-center gap-3">

            <div className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-purple-50
              text-purple-600
            ">
              <MessageSquare size={18} />
            </div>

            <div>
              <h2 className="
                text-base
                font-semibold
                text-gray-900
              ">
                Client Notes
              </h2>

              <p className="
                mt-0.5
                text-xs
                text-gray-500
              ">
                Internal notes related to this client
              </p>
            </div>

          </div>
        </div>


        <div className="p-5">

          {!client.notes?.length ? (

            <div className="
              rounded-xl
              border
              border-dashed
              border-gray-200
              bg-gray-50/60
              px-5
              py-10
              text-center
            ">

              <MessageSquare
                size={24}
                className="mx-auto text-gray-400"
              />

              <p className="
                mt-3
                text-sm
                font-semibold
                text-gray-700
              ">
                No notes yet
              </p>

              <p className="
                mt-1
                text-xs
                text-gray-500
              ">
                Add a note to keep track of important client information.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {client.notes.map((n, i) => (

                <div
                  key={i}
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-4
                    transition-all
                    duration-200
                    hover:border-purple-200
                    hover:shadow-sm
                  "
                >

                  <div className="flex gap-3">

                    <div className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-purple-50
                      text-purple-600
                    ">
                      <MessageSquare size={15} />
                    </div>

                    <div className="min-w-0">

                      <p className="
                        whitespace-pre-wrap
                        text-sm
                        leading-6
                        text-gray-700
                      ">
                        {n.text}
                      </p>

                      <p className="
                        mt-2
                        text-xs
                        text-gray-400
                      ">
                        {formatDate(n.createdAt)}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </Card>


      {/* =====================================================
          ADD PAYMENT MODAL
      ===================================================== */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title="Add Payment"
      >
        <form
          onSubmit={submitPayment}
          className="space-y-5"
        >

          <Input
            label="Amount (₹)"
            type="number"
            required
            value={payForm.amount}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                amount: Number(e.target.value),
              })
            }
          />

          <Select
            label="Payment Method"
            value={payForm.paymentMethod}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                paymentMethod: e.target.value,
              })
            }
          >
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Card</option>
            <option>Other</option>
          </Select>

          <Input
            label="Transaction ID"
            value={payForm.transactionId}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                transactionId: e.target.value,
              })
            }
          />

          <Input
            label="Payment Date"
            type="date"
            value={payForm.paymentDate}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                paymentDate: e.target.value,
              })
            }
          />

          <Input
            label="Notes"
            value={payForm.notes}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                notes: e.target.value,
              })
            }
          />

          <div className="
            flex
            justify-end
            gap-3
            border-t
            border-gray-100
            pt-5
          ">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayModal(false)}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-xl px-5 font-semibold"
            >
              Save Payment
            </Button>
          </div>

        </form>
      </Modal>


      {/* =====================================================
          ADD NOTE MODAL
      ===================================================== */}
      <Modal
        open={noteModal}
        onClose={() => setNoteModal(false)}
        title="Add Note"
      >
        <form
          onSubmit={submitNote}
          className="space-y-5"
        >

          <div>
            <label className="
              mb-1.5
              block
              text-sm
              font-medium
              text-gray-700
            ">
              Note
            </label>

            <textarea
              className="
                w-full
                resize-y
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-3
                text-sm
                leading-6
                text-gray-800
                outline-none
                transition-all
                duration-200
                placeholder:text-gray-400
                hover:border-gray-300
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
              "
              rows="5"
              placeholder="Write note..."
              value={noteText}
              onChange={(e) =>
                setNoteText(e.target.value)
              }
            />
          </div>

          <div className="
            flex
            justify-end
            gap-3
            border-t
            border-gray-100
            pt-5
          ">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteModal(false)}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-xl px-5 font-semibold"
            >
              Add Note
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
}


/* ============================================================
   INFO COMPONENT
============================================================ */

const Info = ({
  icon: Icon,
  label,
  value,
  full = false,
}) => (
  <div
    className={`
      rounded-xl
      border
      border-gray-100
      bg-gray-50/60
      p-4
      ${full ? 'w-full' : ''}
    `}
  >

    <div className="flex items-start gap-3">

      {Icon && (
        <div className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-white
          text-blue-600
          shadow-sm
        ">
          <Icon size={17} />
        </div>
      )}

      <div className="min-w-0">

        <p className="
          text-[11px]
          font-semibold
          uppercase
          tracking-wide
          text-gray-400
        ">
          {label}
        </p>

        <p className="
          mt-1
          break-words
          whitespace-pre-wrap
          text-sm
          font-medium
          leading-6
          text-gray-800
        ">
          {value || '—'}
        </p>

      </div>

    </div>

  </div>
);


/* ============================================================
   FINANCIAL ROW
============================================================ */

const FinancialRow = ({
  label,
  value,
  color,
  icon: Icon,
}) => (
  <div className="
    flex
    items-center
    justify-between
    gap-3
    rounded-xl
    border
    border-gray-100
    bg-gray-50/60
    p-4
  ">

    <div className="flex items-center gap-3">

      <div className={`
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        ${
          color === 'green'
            ? 'bg-green-50 text-green-600'
            : color === 'red'
              ? 'bg-red-50 text-red-600'
              : 'bg-blue-50 text-blue-600'
        }
      `}>
        <Icon size={17} />
      </div>

      <span className="
        text-sm
        font-medium
        text-gray-600
      ">
        {label}
      </span>

    </div>

    <span className={`
      text-sm
      font-bold
      ${
        color === 'green'
          ? 'text-green-600'
          : color === 'red'
            ? 'text-red-600'
            : 'text-gray-900'
      }
    `}>
      {value}
    </span>

  </div>
);

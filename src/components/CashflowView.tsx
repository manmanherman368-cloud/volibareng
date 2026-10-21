import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Share2,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Coins,
  Receipt
} from 'lucide-react';
import {
  Team,
  UserProfile,
  UserRole,
  CashflowTransaction,
  CashflowSummary,
  MemberDue,
  CashflowType,
  CashflowCategory,
  VolleyballEvent,
  TeamMember
} from '../types';

interface CashflowViewProps {
  team: Team | null;
  currentUser: UserProfile;
  currentRole: UserRole | null;
  summary: CashflowSummary | null;
  transactions: CashflowTransaction[];
  dues: MemberDue[];
  events: VolleyballEvent[];
  members: TeamMember[];
  onAddTransaction: (data: {
    type: CashflowType;
    category: CashflowCategory;
    amount: number;
    description: string;
    date: string;
    eventId?: string;
  }) => Promise<void>;
  onUpdateTransaction: (transId: string, data: Partial<CashflowTransaction>) => Promise<void>;
  onDeleteTransaction: (transId: string) => Promise<void>;
  onToggleDue: (dueId: string, status: 'lunas' | 'belum_lunas', notes?: string) => Promise<void>;
  onAddDue: (data: { targetUserId: string; period: string; amount: number; notes?: string }) => Promise<void>;
}

const CATEGORIES_INCOME: CashflowCategory[] = [
  'Iuran Rutin Anggota',
  'Patungan Sewa Lapangan',
  'Donasi & Sponsor',
  'Turnamen & Sparing',
  'Lainnya',
];

const CATEGORIES_EXPENSE: CashflowCategory[] = [
  'Sewa Lapangan / GOR',
  'Bola Voli & Net',
  'Air Minum & Konsumsi',
  'Medis & P3K',
  'Jersey Tim',
  'Turnamen & Sparing',
  'Lainnya',
];

export const CashflowView: React.FC<CashflowViewProps> = ({
  team,
  currentUser,
  currentRole,
  summary,
  transactions,
  dues,
  events,
  members,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onToggleDue,
  onAddDue,
}) => {
  const [subTab, setSubTab] = useState<'transaksi' | 'iuran'>('transaksi');
  const [typeFilter, setTypeFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [search, setSearch] = useState('');
  
  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<CashflowTransaction | null>(null);
  const [isAddDueOpen, setIsAddDueOpen] = useState(false);
  
  // WhatsApp Share Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waText, setWaText] = useState('');
  const [waCopied, setWaCopied] = useState(false);

  // Form states for transaction
  const [txType, setTxType] = useState<CashflowType>('masuk');
  const [txCategory, setTxCategory] = useState<CashflowCategory>('Iuran Rutin Anggota');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [txEventId, setTxEventId] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  // Form states for new dues
  const [dueTargetUser, setDueTargetUser] = useState('all');
  const [duePeriod, setDuePeriod] = useState('Oktober 2026');
  const [dueAmount, setDueAmount] = useState<number | ''>(50000);
  const [dueNotes, setDueNotes] = useState('');
  const [dueLoading, setDueLoading] = useState(false);

  const formatRp = (num: number) => {
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setTxType('masuk');
    setTxCategory('Iuran Rutin Anggota');
    setTxAmount('');
    setTxDescription('');
    setTxEventId('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxError('');
    setIsAddTxOpen(true);
  };

  const handleOpenEditTx = (tx: CashflowTransaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxAmount(tx.amount);
    setTxDescription(tx.description);
    setTxEventId(tx.eventId || '');
    setTxDate(tx.date.slice(0, 10));
    setTxError('');
    setIsAddTxOpen(true);
  };

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0 || !txDescription.trim()) {
      setTxError('Nominal dan keterangan transaksi wajib diisi.');
      return;
    }

    setTxLoading(true);
    setTxError('');
    try {
      if (editingTx) {
        await onUpdateTransaction(editingTx.id, {
          type: txType,
          category: txCategory,
          amount: Number(txAmount),
          description: txDescription.trim(),
          date: new Date(txDate).toISOString(),
          eventId: txEventId || undefined,
        });
      } else {
        await onAddTransaction({
          type: txType,
          category: txCategory,
          amount: Number(txAmount),
          description: txDescription.trim(),
          date: new Date(txDate).toISOString(),
          eventId: txEventId || undefined,
        });
      }
      setIsAddTxOpen(false);
    } catch (err: any) {
      setTxError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setTxLoading(false);
    }
  };

  const handleOpenWaReport = async () => {
    if (!team) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/cashflow/whatsapp-report`);
      const data = await res.json();
      setWaText(data.text);
      setShowWaModal(true);
    } catch {
      alert('Gagal mengambil laporan kas');
    }
  };

  const handleCreateDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueAmount || !duePeriod.trim()) return;

    setDueLoading(true);
    try {
      if (dueTargetUser === 'all') {
        for (const m of members) {
          await onAddDue({
            targetUserId: m.userId,
            period: duePeriod.trim(),
            amount: Number(dueAmount),
            notes: dueNotes.trim() || undefined,
          });
        }
      } else {
        await onAddDue({
          targetUserId: dueTargetUser,
          period: duePeriod.trim(),
          amount: Number(dueAmount),
          notes: dueNotes.trim() || undefined,
        });
      }
      setIsAddDueOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tagihan');
    } finally {
      setDueLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const unpaidDues = dues.filter((d) => d.status === 'belum_lunas');

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Catatan Uang Kas Tim</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Transparan
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola saldo kas, iuran rutin anggota, patungan sewa lapangan, dan pembelanjaan tim voli.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleOpenWaReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Laporan WhatsApp</span>
          </button>

          {currentRole === 'admin' && (
            <button
              onClick={handleOpenAddTx}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-400" />
                Saldo Kas Saat Ini
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Aktif
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-2">
              {formatRp(summary.currentBalance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Kas bersih siap pakai untuk sewa lapangan & perlengkapan.
            </p>
          </div>

          {/* Income Card */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Total Pemasukan
              </span>
              <span className="text-[10px] text-slate-400">
                Bulan ini: {formatRp(summary.thisMonthIncome)}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-2">
              +{formatRp(summary.totalIncome)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari iuran bulanan, patungan GOR, & donasi.
            </p>
          </div>

          {/* Expense Card */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                Total Pengeluaran
              </span>
              <span className="text-[10px] text-slate-400">
                Bulan ini: {formatRp(summary.thisMonthExpense)}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-2">
              -{formatRp(summary.totalExpense)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sewa lapangan, bola Mikasa, P3K & minum.
            </p>
          </div>
        </div>
      )}

      {/* Dues Warning Banner if Any */}
      {unpaidDues.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">
                {unpaidDues.length} Pemain Belum Melunasi Iuran Kas
              </p>
              <p className="text-slate-400 text-[11px]">
                Total tertunda: <strong>{formatRp(unpaidDues.reduce((s, d) => s + d.amount, 0))}</strong>. Lihat daftar di tab "Status Iuran Anggota".
              </p>
            </div>
          </div>

          <button
            onClick={() => setSubTab('iuran')}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-bold transition shrink-0"
          >
            Lihat Tagihan
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSubTab('transaksi')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              subTab === 'transaksi'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Mutasi & Transaksi ({transactions.length})</span>
          </button>

          <button
            onClick={() => setSubTab('iuran')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              subTab === 'iuran'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Status Iuran Pemain ({dues.length})</span>
          </button>
        </div>

        {subTab === 'transaksi' && (
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  typeFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('masuk')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  typeFilter === 'masuk' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setTypeFilter('keluar')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  typeFilter === 'keluar' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400'
                }`}
              >
                Pengeluaran
              </button>
            </div>

            <div className="relative flex-1 sm:w-40">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {subTab === 'iuran' && currentRole === 'admin' && (
          <button
            onClick={() => setIsAddDueOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold rounded-xl text-xs border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Tagihan Iuran</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: TRANSAKSI LIST */}
      {subTab === 'transaksi' && (
        <div className="space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-xs">Belum ada transaksi yang sesuai.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'masuk';
              const dateStr = new Date(tx.date).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm hover:border-slate-750 transition"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                      }`}
                    >
                      {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-100">
                          {tx.description}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                          {tx.category}
                        </span>
                        {tx.eventTitle && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 truncate max-w-[180px]">
                            🏐 {tx.eventTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>Dicatat oleh: {tx.recordedByName || 'Pengurus'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                    <p
                      className={`text-base font-black font-mono tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatRp(tx.amount)}
                    </p>

                    {currentRole === 'admin' && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => handleOpenEditTx(tx)}
                          className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
                          title="Edit transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus catatan transaksi kas ini?')) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 2: MEMBER DUES (STATUS IURAN ANGGOTA) */}
      {subTab === 'iuran' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-black text-slate-200 text-sm">
                Daftar Iuran Kas Anggota Komunitas
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pantau siapa saja yang sudah bayar kas bulanan dan patungan latihan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                Lunas: {dues.filter((d) => d.status === 'lunas').length}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25">
                Belum: {unpaidDues.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dues.map((due) => {
              const isPaid = due.status === 'lunas';
              const isCurrentUser = due.userId === currentUser.id;

              return (
                <div
                  key={due.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                    isPaid
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-900 border-amber-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                      {due.user?.avatar || '🏐'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-100 truncate">
                          {due.user?.displayName || 'Pemain'}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                            Kamu
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {due.period} • <strong className="text-amber-400 font-mono">{formatRp(due.amount)}</strong>
                      </p>

                      {due.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[200px]">
                          "{due.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isPaid ? '✅ Lunas' : '⏳ Belum Lunas'}
                    </span>

                    {/* Admin Toggle Button */}
                    {currentRole === 'admin' ? (
                      <button
                        onClick={() => {
                          const nextStatus = isPaid ? 'belum_lunas' : 'lunas';
                          const defaultNote = isPaid ? undefined : 'Dikonfirmasi Lunas oleh Admin';
                          onToggleDue(due.id, nextStatus, defaultNote);
                        }}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition ${
                          isPaid
                            ? 'bg-slate-800 text-slate-400 hover:text-rose-400'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {isPaid ? 'Batal Lunas' : 'Tandai Lunas'}
                      </button>
                    ) : (
                      isPaid && due.paidAt && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(due.paidAt).toLocaleDateString('id-ID')}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TRANSACTION */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                {editingTx ? 'Edit Transaksi Kas' : 'Catat Transaksi Uang Kas'}
              </h3>
              <button
                onClick={() => setIsAddTxOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {txError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {txError}
              </div>
            )}

            <form onSubmit={handleSubmitTx} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('masuk');
                      setTxCategory('Iuran Rutin Anggota');
                    }}
                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                      txType === 'masuk'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Pemasukan (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('keluar');
                      setTxCategory('Sewa Lapangan / GOR');
                    }}
                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                      txType === 'keluar'
                        ? 'bg-rose-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Pengeluaran (-)</span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Kategori Transaksi</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as CashflowCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {(txType === 'masuk' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nominal (Rupiah) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="Contoh: 150000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-slate-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Keterangan Transaksi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sewa lapangan GOR Bulungan Court 2 (2 jam)"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Link to Match Event */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Tautkan ke Jadwal Main (Opsional)
                </label>
                <select
                  value={txEventId}
                  onChange={(e) => setTxEventId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Tidak Ditautkan ke Jadwal --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({new Date(ev.startsAt).toLocaleDateString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={txLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl disabled:opacity-50"
                >
                  {txLoading ? 'Menyimpan...' : editingTx ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DUES */}
      {isAddDueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                Tambah Tagihan Iuran Kas
              </h3>
              <button
                onClick={() => setIsAddDueOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDues} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Anggota</label>
                <select
                  value={dueTargetUser}
                  onChange={(e) => setDueTargetUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">👑 Semua Anggota Tim ({members.length} Orang)</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.displayName || 'Pemain'} ({m.user?.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Periode / Kegiatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: November 2026 atau Patungan Sparing"
                  value={duePeriod}
                  onChange={(e) => setDuePeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nominal Iuran (Rupiah) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-slate-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Catatan Tagihan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Jatuh tempo tgl 15"
                  value={dueNotes}
                  onChange={(e) => setDueNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDueOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={dueLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl disabled:opacity-50"
                >
                  {dueLoading ? 'Membuat...' : 'Buat Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP CASHFLOW REPORT */}
      {showWaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Laporan Kas Transparan untuk WhatsApp
              </h3>
              <button
                onClick={() => setShowWaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              value={waText}
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(waText);
                  setWaCopied(true);
                  setTimeout(() => setWaCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                {waCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{waCopied ? 'Tersalin ke Clipboard!' : 'Salin Laporan Kas'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka WhatsApp Langsung</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

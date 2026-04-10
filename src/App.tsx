/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  Share2, 
  Lock, 
  LogOut, 
  Users, 
  CheckCircle2, 
  Clock, 
  CalendarDays, 
  Table as TableIcon, 
  BarChart3, 
  UserPlus, 
  CalendarPlus, 
  Settings, 
  Search, 
  X, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Save,
  AlertTriangle,
  Info,
  ChevronRight,
  User as UserIcon,
  Filter,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { AppData, Member, Period, PaymentStatus } from './types';
import { DEFAULT_DATA, MONTHS, MONTHS_SHORT } from './constants';

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getAvatarClass = (index: number) => {
  return `avatar-${index % 10}`;
};

const generateId = (prefix: string = "id") => {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
};

// --- Main Component ---
export default function App() {
  // --- State ---
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem("kasAppData");
    if (saved) {
      try {
        return { ...DEFAULT_DATA, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem("kasAdmin") === "true";
  });

  const [activeTab, setActiveTab] = useState<'table' | 'rekap' | 'members' | 'chart'>('table');
  const [searchQuery, setSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'exempt'>('all');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'member' | 'period', id: string, name: string } | null>(null);

  // Form States
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberStatus, setNewMemberStatus] = useState<PaymentStatus>("unpaid");

  const [newPeriodMonth, setNewPeriodMonth] = useState(new Date().getMonth() + 1);
  const [newPeriodYear, setNewPeriodYear] = useState(new Date().getFullYear());
  const [newPeriodAmount, setNewPeriodAmount] = useState<number | "">("");

  const [settingsGroupName, setSettingsGroupName] = useState(data.groupName);
  const [settingsGroupDesc, setSettingsGroupDesc] = useState(data.groupDescription);
  const [settingsCashAmount, setSettingsCashAmount] = useState(data.cashAmount);
  const [settingsNewPassword, setSettingsNewPassword] = useState("");

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("kasAppData", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- Handlers ---
  const showNotif = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const handleLogin = () => {
    if (loginPassword === data.adminPassword) {
      setIsAdmin(true);
      sessionStorage.setItem("kasAdmin", "true");
      setShowLoginModal(false);
      setLoginPassword("");
      setLoginError(false);
      showNotif("Login berhasil! Selamat datang, Admin 🎉");
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("kasAdmin");
    setShowLogoutConfirm(false);
    showNotif("Berhasil logout. Sampai jumpa!", "info");
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      showNotif("Nama anggota tidak boleh kosong!", "error");
      return;
    }

    if (data.members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
      showNotif(`Anggota "${newMemberName}" sudah ada!`, "error");
      return;
    }

    const payments: Record<string, PaymentStatus> = {};
    data.periods.forEach(p => {
      payments[p.id] = newMemberStatus;
    });

    const newMember: Member = {
      id: generateId("m"),
      name: newMemberName.trim(),
      payments
    };

    setData(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));

    setNewMemberName("");
    setShowAddMemberModal(false);
    showNotif(`Anggota "${newMember.name}" berhasil ditambahkan! 👤`);
  };

  const handleAddPeriod = () => {
    const periodId = `${newPeriodYear}-${newPeriodMonth}`;
    if (data.periods.some(p => p.id === periodId)) {
      showNotif("Periode ini sudah ada!", "error");
      return;
    }

    const amount = Number(newPeriodAmount) || data.cashAmount;
    const label = `${MONTHS_SHORT[newPeriodMonth - 1]} ${newPeriodYear}`;

    const newPeriod: Period = {
      id: periodId,
      label,
      month: newPeriodMonth,
      year: newPeriodYear,
      amount
    };

    setData(prev => {
      const newPeriods = [...prev.periods, newPeriod].sort((a, b) => 
        (a.year * 12 + a.month) - (b.year * 12 + b.month)
      );

      const newMembers = prev.members.map(m => ({
        ...m,
        payments: {
          ...m.payments,
          [periodId]: "unpaid" as PaymentStatus
        }
      }));

      return {
        ...prev,
        periods: newPeriods,
        members: newMembers
      };
    });

    setShowAddPeriodModal(false);
    showNotif(`Periode "${label}" berhasil ditambahkan! 📅`);
  };

  const handleDeleteMember = (id: string) => {
    const member = data.members.find(m => m.id === id);
    setData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
    setDeleteConfirm(null);
    showNotif(`Anggota "${member?.name}" berhasil dihapus.`, "warning");
  };

  const handleDeletePeriod = (id: string) => {
    const period = data.periods.find(p => p.id === id);
    setData(prev => ({
      ...prev,
      periods: prev.periods.filter(p => p.id !== id),
      members: prev.members.map(m => {
        const newPayments = { ...m.payments };
        delete newPayments[id];
        return { ...m, payments: newPayments };
      })
    }));
    setDeleteConfirm(null);
    showNotif(`Periode "${period?.label}" berhasil dihapus.`, "warning");
  };

  const togglePayment = (memberId: string, periodId: string) => {
    if (!isAdmin) return;

    setData(prev => {
      const newMembers = prev.members.map(m => {
        if (m.id === memberId) {
          const current = m.payments[periodId] || "unpaid";
          const next: PaymentStatus = current === "unpaid" ? "paid" : current === "paid" ? "exempt" : "unpaid";
          return {
            ...m,
            payments: { ...m.payments, [periodId]: next }
          };
        }
        return m;
      });
      return { ...prev, members: newMembers };
    });
  };

  const handleSaveSettings = () => {
    if (!settingsGroupName.trim()) {
      showNotif("Nama grup tidak boleh kosong!", "error");
      return;
    }

    setData(prev => ({
      ...prev,
      groupName: settingsGroupName.trim(),
      groupDescription: settingsGroupDesc.trim(),
      cashAmount: Number(settingsCashAmount) || prev.cashAmount,
      adminPassword: settingsNewPassword.trim() || prev.adminPassword
    }));

    setSettingsNewPassword("");
    setShowSettingsModal(false);
    showNotif("Pengaturan berhasil disimpan! ⚙️");
  };

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-kas-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif("Data berhasil diekspor! 💾");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!imported.members || !imported.periods) throw new Error();
        setData({ ...DEFAULT_DATA, ...imported });
        showNotif("Data berhasil diimpor! 📂");
        setShowSettingsModal(false);
      } catch (err) {
        showNotif("File tidak valid atau rusak!", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: data.groupName,
        text: `Lihat laporan kas ${data.groupName} di sini:`,
        url
      }).catch(() => copyToClipboard(url));
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showNotif("Link berhasil disalin! 🔗"))
      .catch(() => showNotif("Gagal menyalin link", "error"));
  };

  // --- Computed Stats ---
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalPending = 0;
    let totalPaidCount = 0;
    let totalUnpaidCount = 0;

    data.periods.forEach(p => {
      data.members.forEach(m => {
        const status = m.payments[p.id] || "unpaid";
        if (status === "paid") {
          totalCollected += p.amount;
          totalPaidCount++;
        } else if (status === "unpaid") {
          totalPending += p.amount;
          totalUnpaidCount++;
        }
      });
    });

    return {
      totalMembers: data.members.length,
      totalPeriods: data.periods.length,
      totalCollected,
      totalPending,
      totalPaidCount,
      totalUnpaidCount
    };
  }, [data]);

  const filteredMembers = useMemo(() => {
    return data.members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (memberStatusFilter === 'all') return matchesSearch;
      
      const statuses = Object.values(m.payments);
      const hasStatus = statuses.includes(memberStatusFilter);
      
      return matchesSearch && hasStatus;
    });
  }, [data.members, searchQuery, memberStatusFilter]);

  const chartData = useMemo(() => {
    return data.periods.map(p => {
      let collected = 0;
      data.members.forEach(m => {
        if (m.payments[p.id] === 'paid') {
          collected += p.amount;
        }
      });
      return {
        name: p.label,
        collected: collected
      };
    });
  }, [data]);

  // --- Components ---
  const Modal = ({ isOpen, onClose, title, children, icon: Icon, iconColor, footer }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-7 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${iconColor}`}>
              <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
          </div>
          <div className="px-7 pb-7 space-y-4">
            {children}
          </div>
          {footer && (
            <div className="px-7 pb-7 flex gap-3 justify-end">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`fixed top-5 right-5 z-[2000] p-4 rounded-2xl shadow-xl flex items-center gap-3 font-medium min-w-[280px] ${
              notification.type === 'success' ? 'bg-emerald-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-amber-500 text-white' :
              'bg-cyan-500 text-white'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 size={20} />}
            {notification.type === 'error' && <AlertTriangle size={20} />}
            {notification.type === 'warning' && <AlertTriangle size={20} />}
            {notification.type === 'info' && <Info size={20} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{data.groupName}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">{data.groupDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-bold">
                <ShieldCheck size={14} />
                <span>Admin Mode</span>
              </div>
            )}
            <button onClick={handleShare} className="p-2 sm:px-3 sm:py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-medium">
              <Share2 size={16} />
              <span className="hidden sm:inline">Bagikan</span>
            </button>
            {!isAdmin ? (
              <button onClick={() => setShowLoginModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium shadow-md shadow-blue-200">
                <Lock size={16} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            ) : (
              <button onClick={() => setShowLogoutConfirm(true)} className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 text-sm font-medium shadow-md shadow-red-200">
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Anggota</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatNumber(stats.totalMembers)}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Sudah Lunas</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatCurrency(stats.totalCollected)}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Belum Bayar</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatCurrency(stats.totalPending)}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Periode</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatNumber(stats.totalPeriods)}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex gap-1 w-full overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'table' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <TableIcon size={16} />
                <span>Tabel</span>
              </button>
              <button 
                onClick={() => setActiveTab('rekap')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'rekap' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <BarChart3 size={16} />
                <span>Rekap</span>
              </button>
              <button 
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'members' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Users size={16} />
                <span>Anggota</span>
              </button>
              <button 
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'chart' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <TrendingUp size={16} />
                <span>Grafik</span>
              </button>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowAddMemberModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100">
                  <UserPlus size={16} />
                  <span>Tambah Anggota</span>
                </button>
                <button onClick={() => setShowAddPeriodModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-md shadow-amber-100">
                  <CalendarPlus size={16} />
                  <span>Tambah Periode</span>
                </button>
                <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
                  <Settings size={16} />
                  <span>Pengaturan</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'table' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <TableIcon size={20} className="text-blue-600" />
                      Tabel Pembayaran Iuran
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Klik status untuk mengubah (Admin only)</p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari anggota..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    <CheckCircle2 size={12} /> Lunas
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <X size={12} /> Belum
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <div className="w-2 h-[1px] bg-slate-400" /> Bebas
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-900 text-white">
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-12 sticky left-0 z-20 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">No</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider min-w-[200px] sticky left-12 z-20 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Nama Anggota</th>
                        {data.periods.map(p => (
                          <th key={p.id} className="px-4 py-4 text-center min-w-[120px]">
                            <span className="block text-sm font-bold">{p.label}</span>
                            <span className="block text-[10px] font-normal opacity-70">{formatCurrency(p.amount)}</span>
                            {isAdmin && (
                              <button 
                                onClick={() => setDeleteConfirm({ type: 'period', id: p.id, name: p.label })}
                                className="mt-2 text-[10px] bg-red-500/20 text-red-200 px-2 py-0.5 rounded hover:bg-red-500/40 transition-colors"
                              >
                                Hapus
                              </button>
                            )}
                          </th>
                        ))}
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Lunas</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Belum</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.length > 0 ? filteredMembers.map((m, idx) => {
                        let paidCount = 0;
                        let unpaidCount = 0;
                        let totalPaid = 0;

                        data.periods.forEach(p => {
                          const status = m.payments[p.id] || "unpaid";
                          if (status === "paid") {
                            paidCount++;
                            totalPaid += p.amount;
                          } else if (status === "unpaid") {
                            unpaidCount++;
                          }
                        });

                        return (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 py-4 text-center text-xs font-bold text-slate-400 sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{idx + 1}</td>
                            <td className="px-6 py-4 sticky left-12 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getAvatarClass(idx)}`}>
                                  {getInitials(m.name)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800">{m.name}</div>
                                  <div className="text-[10px] text-slate-400">{paidCount} lunas · {unpaidCount} belum</div>
                                </div>
                                {isAdmin && (
                                  <button 
                                    onClick={() => setDeleteConfirm({ type: 'member', id: m.id, name: m.name })}
                                    className="ml-auto p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                            {data.periods.map(p => {
                              const status = m.payments[p.id] || "unpaid";
                              return (
                                <td key={p.id} className="px-4 py-4 text-center">
                                  {isAdmin ? (
                                    <button 
                                      onClick={() => togglePayment(m.id, p.id)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                                        status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' :
                                        status === 'unpaid' ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100' :
                                        'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                      }`}
                                    >
                                      {status === 'paid' && <CheckCircle2 size={12} />}
                                      {status === 'unpaid' && <X size={12} />}
                                      {status === 'exempt' && <div className="w-2 h-[1px] bg-slate-400" />}
                                      {status === 'paid' ? 'Lunas' : status === 'unpaid' ? 'Belum' : 'Bebas'}
                                    </button>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                      status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      status === 'unpaid' ? 'bg-red-50 text-red-700 border-red-100' :
                                      'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                      {status === 'paid' && <CheckCircle2 size={12} />}
                                      {status === 'unpaid' && <X size={12} />}
                                      {status === 'exempt' && <div className="w-2 h-[1px] bg-slate-400" />}
                                      {status === 'paid' ? 'Lunas' : status === 'unpaid' ? 'Belum' : 'Bebas'}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-4 text-center text-sm font-bold text-emerald-600">{paidCount}</td>
                            <td className="px-4 py-4 text-center text-sm font-bold text-red-600">{unpaidCount}</td>
                            <td className="px-4 py-4 text-center text-sm font-bold text-emerald-700">{formatCurrency(totalPaid)}</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={data.periods.length + 4} className="py-20 text-center">
                            <Users size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">Tidak ada anggota ditemukan</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'chart' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Visualisasi Pendapatan Kas
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Total dana terkumpul per periode iuran</p>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `Rp ${value/1000}k`}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          padding: '12px'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Terkumpul']}
                      />
                      <Bar dataKey="collected" radius={[8, 8, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'rekap' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.periods.length > 0 ? [...data.periods].reverse().map(p => {
                  let paid = 0;
                  let unpaid = 0;
                  let exempt = 0;
                  let collected = 0;

                  data.members.forEach(m => {
                    const status = m.payments[p.id] || "unpaid";
                    if (status === "paid") {
                      paid++;
                      collected += p.amount;
                    } else if (status === "unpaid") {
                      unpaid++;
                    } else {
                      exempt++;
                    }
                  });

                  const pct = data.members.length > 0 ? Math.round((paid / (data.members.length - exempt)) * 100) || 0 : 0;
                  const unpaidMembers = data.members.filter(m => (m.payments[p.id] || "unpaid") === "unpaid");

                  return (
                    <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:-translate-y-1 transition-transform">
                      <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            <CalendarDays size={16} className="text-blue-400" />
                            {p.label}
                          </div>
                          <div className="text-[10px] opacity-70 mt-0.5">Iuran: {formatCurrency(p.amount)}</div>
                        </div>
                        <div className="text-lg font-black text-emerald-400">{formatCurrency(collected)}</div>
                      </div>
                      <div className="p-5">
                        <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-5">
                          <div className="bg-slate-50 p-3 rounded-2xl text-center">
                            <div className="text-lg font-black text-emerald-600 leading-tight">{paid}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Lunas</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl text-center">
                            <div className="text-lg font-black text-red-600 leading-tight">{unpaid}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Belum</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl text-center">
                            <div className="text-lg font-black text-slate-500 leading-tight">{exempt}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Bebas</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock size={12} /> Belum Bayar
                          </div>
                          <div className="space-y-2">
                            {unpaidMembers.length > 0 ? unpaidMembers.slice(0, 5).map(m => (
                              <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                                <span className="font-medium text-slate-700 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  {m.name}
                                </span>
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Belum</span>
                              </div>
                            )) : (
                              <div className="text-center py-4 text-xs text-emerald-600 font-bold bg-emerald-50 rounded-2xl">
                                🎉 Semua sudah lunas!
                              </div>
                            )}
                            {unpaidMembers.length > 5 && (
                              <div className="text-center text-[10px] text-slate-400 font-medium pt-1">
                                +{unpaidMembers.length - 5} lainnya belum bayar
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-20 text-center">
                    <CalendarDays size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">Belum ada periode yang ditambahkan</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Filter size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Filter Status:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {(['all', 'paid', 'unpaid', 'exempt'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setMemberStatusFilter(status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          memberStatusFilter === status 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {status === 'all' ? 'Semua' : status === 'paid' ? 'Lunas' : status === 'unpaid' ? 'Belum' : 'Bebas'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembers.length > 0 ? filteredMembers.map((m, idx) => {
                  let paid = 0;
                  let unpaid = 0;
                  let exempt = 0;
                  let totalPaid = 0;
                  let totalOwed = 0;

                  data.periods.forEach(p => {
                    const status = m.payments[p.id] || "unpaid";
                    if (status === "paid") {
                      paid++;
                      totalPaid += p.amount;
                    } else if (status === "unpaid") {
                      unpaid++;
                      totalOwed += p.amount;
                    } else {
                      exempt++;
                    }
                  });

                  const total = data.periods.length;
                  const pct = total > 0 ? Math.round((paid / (total - exempt)) * 100) || 0 : 0;

                  return (
                    <div key={m.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:-translate-y-1 transition-transform group">
                      <div className="p-5 flex items-center gap-4 relative">
                        <div className="absolute top-4 left-4 w-6 h-6 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-10 shadow-sm">
                          {idx + 1}
                        </div>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg ${getAvatarClass(idx)}`}>
                          {getInitials(m.name)}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-900">{m.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{pct}% sudah lunas</div>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => setDeleteConfirm({ type: 'member', id: m.id, name: m.name })}
                            className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="px-5 pb-5">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                            <div className="text-lg font-black text-emerald-600 leading-tight">{paid}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Lunas</div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                            <div className="text-lg font-black text-red-600 leading-tight">{unpaid}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Belum</div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                            <div className="text-lg font-black text-slate-500 leading-tight">{exempt}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Bebas</div>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl text-xs">
                          <div className="flex flex-col">
                            <span className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Total Bayar</span>
                            <span className="text-emerald-700 font-black">{formatCurrency(totalPaid)}</span>
                          </div>
                          <div className="w-[1px] h-6 bg-slate-200" />
                          <div className="flex flex-col text-right">
                            <span className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Tunggakan</span>
                            <span className="text-red-700 font-black">{formatCurrency(totalOwed)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-20 text-center">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">Belum ada anggota yang ditambahkan</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 py-10 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm font-medium">© 2024 <span className="text-white">{data.groupName}</span> — Dibuat dengan ❤️ untuk kemudahan administrasi</p>
          <p className="text-[10px] mt-2 opacity-50 uppercase tracking-widest">Data disimpan di browser lokal Anda</p>
        </div>
      </footer>

      {/* Modals */}
      <Modal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        title="Login Admin" 
        icon={Lock} 
        iconColor="bg-blue-50 text-blue-600"
        footer={
          <>
            <button onClick={() => setShowLoginModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button onClick={handleLogin} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Masuk</button>
          </>
        }
      >
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 ml-1">Password Admin</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Masukkan password..."
              className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {loginError && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-2 ml-1 font-medium">
              <AlertTriangle size={12} /> Password salah! Coba lagi.
            </p>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        title="Konfirmasi Logout" 
        icon={LogOut} 
        iconColor="bg-red-50 text-red-600"
        footer={
          <>
            <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button onClick={handleLogout} className="px-6 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200">Logout</button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed text-center">
          Apakah Anda yakin ingin keluar dari mode Admin? Anda tidak akan bisa mengubah data sampai login kembali.
        </p>
      </Modal>

      <Modal 
        isOpen={showAddMemberModal} 
        onClose={() => setShowAddMemberModal(false)} 
        title="Tambah Anggota" 
        icon={UserPlus} 
        iconColor="bg-emerald-50 text-emerald-600"
        footer={
          <>
            <button onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button onClick={handleAddMember} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">Tambah</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1">Nama Anggota</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Contoh: Bapak Ahmad..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1">Status Awal (Semua Periode)</label>
            <select 
              value={newMemberStatus}
              onChange={(e) => setNewMemberStatus(e.target.value as PaymentStatus)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none"
            >
              <option value="unpaid">Belum Bayar</option>
              <option value="paid">Lunas</option>
              <option value="exempt">Dibebaskan</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showAddPeriodModal} 
        onClose={() => setShowAddPeriodModal(false)} 
        title="Tambah Periode" 
        icon={CalendarPlus} 
        iconColor="bg-amber-50 text-amber-600"
        footer={
          <>
            <button onClick={() => setShowAddPeriodModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button onClick={handleAddPeriod} className="px-6 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100">Tambah</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1">Bulan</label>
              <select 
                value={newPeriodMonth}
                onChange={(e) => setNewPeriodMonth(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all appearance-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1">Tahun</label>
              <input 
                type="number" 
                value={newPeriodYear}
                onChange={(e) => setNewPeriodYear(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1">Nominal Iuran (Rp)</label>
            <div className="relative">
              <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number" 
                value={newPeriodAmount}
                onChange={(e) => setNewPeriodAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`Default: ${data.cashAmount}`}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 ml-1 mt-1 italic">Kosongkan untuk menggunakan nominal default</p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        title="Pengaturan" 
        icon={Settings} 
        iconColor="bg-slate-100 text-slate-700"
        footer={
          <>
            <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button onClick={handleSaveSettings} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">Simpan</button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1">Nama Grup</label>
            <input 
              type="text" 
              value={settingsGroupName}
              onChange={(e) => setSettingsGroupName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-500 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1">Deskripsi Grup</label>
            <textarea 
              value={settingsGroupDesc}
              onChange={(e) => setSettingsGroupDesc(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-500 focus:bg-white transition-all min-h-[80px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1">Nominal Iuran Default (Rp)</label>
            <input 
              type="number" 
              value={settingsCashAmount}
              onChange={(e) => setSettingsCashAmount(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-500 focus:bg-white transition-all"
            />
          </div>
          <div className="h-[1px] bg-slate-100 my-2" />
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
              <Lock size={12} className="text-amber-500" />
              Password Baru Admin
            </label>
            <input 
              type="password" 
              value={settingsNewPassword}
              onChange={(e) => setSettingsNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-500 focus:bg-white transition-all"
            />
          </div>
          <div className="h-[1px] bg-slate-100 my-2" />
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
              <Download size={12} className="text-blue-500" />
              Backup & Restore Data
            </label>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">
                <Download size={14} /> Export JSON
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer border border-slate-200">
                <Upload size={14} /> Import JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal 
        isOpen={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)} 
        title="Konfirmasi Hapus" 
        icon={Trash2} 
        iconColor="bg-red-50 text-red-600"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button 
              onClick={() => deleteConfirm?.type === 'member' ? handleDeleteMember(deleteConfirm.id) : handleDeletePeriod(deleteConfirm.id)} 
              className="px-6 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-100"
            >
              Ya, Hapus
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed text-center">
          Apakah Anda yakin ingin menghapus {deleteConfirm?.type === 'member' ? 'anggota' : 'periode'} <strong>{deleteConfirm?.name}</strong>? 
          Semua data pembayaran terkait akan ikut terhapus secara permanen.
        </p>
      </Modal>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Edit3,
  Copy,
  Check,
  Calendar,
  Users,
  RefreshCcw,
  AlertCircle,
  Clock,
  Tag
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "../../../core/api/endpoints/adminApi";

/**
 * 🎟 ADMIN COUPON MANAGEMENT (ENTERPRISE EDITION 🔥)
 */
export default function Coupons() {
  /* ================= API DATA ================= */
  const { data: couponRes, isLoading, isError, error, refetch } = useGetCouponsQuery();
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation();

  /* ================= UI STATE ================= */
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    code: "",
    discount: "",
    expiresAt: "",
    usageLimit: "",
  });

  const coupons = useMemo(() => {
    if (Array.isArray(couponRes?.data)) return couponRes.data;
    if (Array.isArray(couponRes)) return couponRes;
    return [];
  }, [couponRes]);

  /* ================= HANDLERS ================= */
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) return toast.error("Code and Discount are required");

    try {
      await createCoupon(form).unwrap();
      toast.success("Coupon Deployed successfully ✅");
      setForm({ code: "", discount: "", expiresAt: "", usageLimit: "" });
      setEditingId(null);
      if(refetch) refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCoupon(id).unwrap();
      toast.success("Coupon permanently removed");
      if(refetch) refetch();
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh] font-black text-slate-400 animate-pulse">
      SYNCING PROMOTIONS...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans text-slate-900 bg-[#f8fafc] min-h-screen">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900">
            <Ticket className="text-indigo-600 h-9 w-9" /> Coupon Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Configure discount incentives and track promotion performance.
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
            <p className="text-lg font-black text-emerald-600">{coupons.filter(c => c.isActive !== false).length}</p>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-lg font-black text-indigo-600">{coupons.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ✏️ LEFT: CREATION WORKSPACE */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-5">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Plus size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight">
                {editingId ? "Modify Code" : "Create Coupon"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Coupon Code</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleInputChange}
                    placeholder="e.g. SUMMER50"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Discount %</label>
                  <input
                    type="number"
                    name="discount"
                    value={form.discount}
                    onChange={handleInputChange}
                    placeholder="15"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleInputChange}
                    placeholder="500"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Expiry Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="date"
                    name="expiresAt"
                    value={form.expiresAt}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isCreating ? <RefreshCcw className="animate-spin" size={18} /> : (editingId ? "Update Coupon" : "Deploy Coupon")}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm({ code: "", discount: "", expiresAt: "", usageLimit: "" }); }}
                  className="w-full py-3 text-slate-400 font-bold text-xs uppercase hover:text-slate-600 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>

        {/* 📋 RIGHT: COUPON LISTING */}
        <div className="lg:col-span-8 space-y-6">
          {/* SEARCH BAR */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={22} />
            <input
              placeholder="Search active codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-6 bg-white border border-slate-100 rounded-[28px] font-bold text-slate-700 shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCoupons.length > 0 ? filteredCoupons.map((coupon) => (
              <div
                key={coupon._id}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
              >
                {/* STATUS BAR */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${coupon.isActive !== false ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${coupon.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{coupon.code}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{coupon.discount}% OFF</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${coupon.isActive !== false ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {coupon.isActive !== false ? "Live" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      {copiedCode === coupon.code ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        setForm({
                          code: coupon.code,
                          discount: coupon.discount,
                          expiresAt: coupon.expiresAt?.split("T")[0] || "",
                          usageLimit: coupon.usageLimit || "",
                        });
                        setEditingId(coupon._id);
                      }}
                      className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Expiry</p>
                      <p className="text-xs font-bold text-slate-600">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <Users size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Usage</p>
                      <p className="text-xs font-bold text-slate-600">{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</p>
                    </div>
                  </div>
                </div>

                {/* DANGER INDICATOR IF EXPIRED */}
                {coupon.expiresAt && new Date(coupon.expiresAt) < new Date() && (
                  <div className="mt-4 flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                    <AlertCircle className="text-red-500" size={14} />
                    <span className="text-[10px] font-black text-red-600 uppercase">This code has expired</span>
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <div className="p-8 bg-slate-50 rounded-full mb-4">
                    <Ticket className="text-slate-200 h-12 w-12" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[2px]">No coupons found in catalog</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

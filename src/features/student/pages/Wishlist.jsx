import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../design-system/layouts/Navbar";
import {
  useBulkAddWishlistToCartMutation,
  useClearWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  useUpdateWishlistSettingsMutation,
} from "../../../core/api/endpoints/wishlistApi";
import {
  useCreateWishlistOrderMutation,
  useHandlePaymentFailureMutation,
  useVerifyPaymentMutation,
} from "../../../core/api/endpoints/paymentApi";
import { getMediaUrl } from "../../../utils/mediaUrl";
import {
  BookOpen,
  ChevronRight,
  Grid3X3,
  Heart,
  List,
  Loader2,
  Lock,
  ShoppingCart,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const getCourseId = (item) => item.course?._id || item.courseId;

const getWishlistItemPrice = (item) => {
  const course = item.course || {};
  if (course.isFree) return 0;
  return Number(item.finalPrice ?? course.finalPrice ?? course.discountPrice ?? course.price ?? 0);
};

const getWishlistItemOriginalPrice = (item) => {
  const course = item.course || {};
  return Number(item.originalPrice ?? course.originalPrice ?? course.price ?? getWishlistItemPrice(item));
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const WishlistCard = ({ item, viewMode, onRemove, onBuy }) => {
  const course = item.course || {};
  const thumbnail = getMediaUrl(
    course.thumbnail,
    "https://via.placeholder.com/480x280?text=Course"
  );
  const rating = Number(course.averageRating || course.rating || 0);
  const students = Number(course.totalStudents || course.studentsEnrolled || 0);
  const originalPrice = getWishlistItemOriginalPrice(item);
  const finalPrice = getWishlistItemPrice(item);
  const hasDiscount = item.hasDiscount || originalPrice > finalPrice;

  const cardClass =
    viewMode === "list"
      ? "grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[220px_1fr]"
      : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <article className={cardClass}>
      <div className="relative overflow-hidden rounded-lg bg-slate-100">
        <img
          src={thumbnail}
          alt={course.title || "Course"}
          className={`${viewMode === "list" ? "h-40 md:h-full" : "h-40"} w-full object-cover`}
        />
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            Price dropped
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-bold text-slate-900">
              {course.title || "Course title"}
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {item.instructorName || "Instructor"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(getCourseId(item))}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:text-red-600"
            title="Remove"
          >
            <Trash2 size={17} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="text-amber-500" />
            {rating ? rating.toFixed(1) : "New"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} />
            {students} students
          </span>
          {course.language && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {course.language}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hasDiscount && originalPrice > 0 && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-lg font-black text-emerald-700">
            {finalPrice <= 0 || course.isFree ? "Free" : formatPrice(finalPrice)}
          </span>
        </div>

        {item.nudges?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.nudges.slice(0, 3).map((nudge) => (
              <span
                key={`${item._id}-${nudge.type}`}
                className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
              >
                {nudge.label}
              </span>
            ))}
          </div>
        )}

        {(item.note || item.personalTags?.length > 0) && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
            {item.note && <p className="text-sm text-slate-600">{item.note}</p>}
            {item.personalTags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.personalTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onBuy(getCourseId(item))}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-black"
          >
            <ShoppingCart size={16} />
            Buy Now
          </button>
          <button
            type="button"
            onClick={() => onBuy(getCourseId(item))}
            className="rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
};

export default function Wishlist() {
  const navigate = useNavigate();
  const [sort, setSort] = useState("recent");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const priceParams = useMemo(() => {
    if (priceRange === "under-1000") return { maxPrice: 1000 };
    if (priceRange === "1000-5000") return { minPrice: 1000, maxPrice: 5000 };
    if (priceRange === "above-5000") return { minPrice: 5000 };
    return {};
  }, [priceRange]);

  const { data, isLoading } = useGetWishlistQuery({
    sort,
    category,
    ...priceParams,
  });
  const [removeFromWishlist, { isLoading: removing }] = useRemoveFromWishlistMutation();
  const [clearWishlist, { isLoading: clearing }] = useClearWishlistMutation();
  const [bulkAddToCart, { isLoading: bulkLoading }] = useBulkAddWishlistToCartMutation();
  const [updateSettings] = useUpdateWishlistSettingsMutation();
  const [createWishlistOrder, { isLoading: creatingWishlistOrder }] =
    useCreateWishlistOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [handlePaymentFailure] = useHandlePaymentFailureMutation();
  const [isPayingWishlist, setIsPayingWishlist] = useState(false);

  const items = useMemo(() => data?.data?.items || [], [data?.data?.items]);
  const total = data?.data?.total || 0;
  const settings = data?.data?.settings || {};
  const checkoutCourseIds = useMemo(
    () => items.map(getCourseId).filter(Boolean),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + getWishlistItemPrice(item), 0),
    [items]
  );
  const originalSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + getWishlistItemOriginalPrice(item), 0),
    [items]
  );
  const subtotalSavings = Math.max(originalSubtotal - subtotal, 0);
  const isWishlistCheckoutDisabled =
    checkoutCourseIds.length === 0 || creatingWishlistOrder || isPayingWishlist;

  const categories = useMemo(() => {
    const values = new Set();
    items.forEach((item) => {
      item.course?.tags?.forEach((tag) => values.add(tag));
      if (item.course?.category) values.add(item.course.category);
    });
    return [...values].filter(Boolean);
  }, [items]);

  const handleRemove = async (courseId) => {
    try {
      await removeFromWishlist(courseId).unwrap();
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(error?.data?.message || "Could not remove course");
    }
  };

  const handleClear = async () => {
    try {
      await clearWishlist().unwrap();
      toast.success("Wishlist cleared");
    } catch (error) {
      toast.error(error?.data?.message || "Could not clear wishlist");
    }
  };

  const handleBulkAdd = async () => {
    try {
      const response = await bulkAddToCart().unwrap();
      const courseIds = response?.data?.courseIds || [];
      localStorage.setItem("wishlistCart", JSON.stringify(courseIds));
      toast.success(`${courseIds.length} courses added to cart`);
    } catch (error) {
      toast.error(error?.data?.message || "Could not add courses");
    }
  };

  const handlePayWishlist = async () => {
    if (checkoutCourseIds.length === 0 || isPayingWishlist) return;

    setIsPayingWishlist(true);
    const loadingToast = toast.loading("Preparing wishlist checkout...");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load payment gateway. Please try again.", {
          id: loadingToast,
        });
        setIsPayingWishlist(false);
        return;
      }

      const orderRes = await createWishlistOrder({
        courseIds: checkoutCourseIds,
      }).unwrap();
      const orderData = orderRes.data;
      toast.dismiss(loadingToast);

      if (orderData.isFree) {
        toast.success("Your wishlist courses are ready!");
        setIsPayingWishlist(false);
        navigate(
          `/payment/success?courseId=${orderData.courseId}&free=true&courses=${orderData.courseCount || checkoutCourseIds.length}`
        );
        return;
      }

      const rzOptions = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency || "INR",
        name: "BharathVidya",
        description: orderData.courseName,
        order_id: orderData.orderId,
        prefill: orderData.prefill || {},
        theme: { color: "#4f46e5" },
        handler: async (response) => {
          const verifyToast = toast.loading("Verifying payment...");
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentRecordId: orderData.paymentRecordId,
            }).unwrap();

            toast.success("Payment successful!", { id: verifyToast });
            navigate(
              `/payment/success?courseId=${orderData.courseId}&paymentId=${response.razorpay_payment_id}&courses=${orderData.courseCount || checkoutCourseIds.length}`
            );
          } catch {
            toast.error("Verification failed. Please contact support.", {
              id: verifyToast,
            });
            navigate(
              `/payment/failed?courseId=${orderData.courseId}&orderId=${orderData.orderId}&source=wishlist`
            );
          } finally {
            setIsPayingWishlist(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await handlePaymentFailure({
              paymentRecordId: orderData.paymentRecordId,
              razorpayOrderId: orderData.orderId,
            }).catch(() => {});
            setIsPayingWishlist(false);
            toast("Payment cancelled.", { icon: "i" });
          },
        },
      };

      const rzp = new window.Razorpay(rzOptions);

      rzp.on("payment.failed", async (response) => {
        await handlePaymentFailure({
          paymentRecordId: orderData.paymentRecordId,
          razorpayOrderId: orderData.orderId,
        }).catch(() => {});
        setIsPayingWishlist(false);
        navigate(
          `/payment/failed?courseId=${orderData.courseId}&orderId=${orderData.orderId}&error=${
            response.error?.description || "unknown"
          }&source=wishlist`
        );
      });

      rzp.open();
    } catch (error) {
      toast.error(error?.data?.message || "Could not start wishlist checkout", {
        id: loadingToast,
      });
      setIsPayingWishlist(false);
    }
  };

  const handleVisibility = async () => {
    try {
      const nextVisibility = settings.visibility === "public" ? "private" : "public";
      await updateSettings({ visibility: nextVisibility }).unwrap();
      toast.success(
        nextVisibility === "public" ? "Wishlist is public" : "Wishlist is private"
      );
    } catch (error) {
      toast.error(error?.data?.message || "Could not update sharing");
    }
  };

  const handleBuy = (courseId) => {
    if (!courseId) return;
    navigate(`/checkout/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-20 md:px-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
            <p className="mt-1 text-sm text-slate-500">
              {total} {total === 1 ? "course saved" : "courses saved"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bulkLoading || total === 0}
              onClick={handleBulkAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <ShoppingCart size={16} />
              Add all to cart
            </button>
            <button
              type="button"
              disabled={clearing || total === 0}
              onClick={handleClear}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Clear wishlist
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 lg:flex">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Recently added</option>
              <option value="price-low">Price low to high</option>
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
            </select>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All prices</option>
              <option value="under-1000">Under Rs 1,000</option>
              <option value="1000-5000">Rs 1,000 to Rs 5,000</option>
              <option value="above-5000">Above Rs 5,000</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleVisibility}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {settings.visibility === "public" ? "Public" : "Private"}
            </button>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-2 ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
                title="Grid view"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md p-2 ${
                  viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <section className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Wishlist subtotal
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black text-slate-900">
                  {formatPrice(subtotal)}
                </span>
                {subtotalSavings > 0 && (
                  <span className="pb-1 text-sm font-bold text-emerald-600">
                    You save {formatPrice(subtotalSavings)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {checkoutCourseIds.length}{" "}
                {checkoutCourseIds.length === 1 ? "course" : "courses"} ready for checkout
              </p>
            </div>

            <button
              type="button"
              disabled={isWishlistCheckoutDisabled}
              onClick={handlePayWishlist}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isPayingWishlist || creatingWishlistOrder ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Lock size={17} />
              )}
              {subtotal <= 0 ? "Enroll all free" : `Pay ${formatPrice(subtotal)}`}
              <ChevronRight size={17} />
            </button>
          </section>
        )}

        {isLoading ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500">
            Loading wishlist...
          </div>
        ) : items.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <Heart size={30} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Your wishlist is empty. Start exploring courses!
            </h2>
            <button
              type="button"
              onClick={() => navigate("/courses")}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <BookOpen size={17} />
              Browse Courses
            </button>
          </section>
        ) : (
          <section
            className={
              viewMode === "list"
                ? "space-y-4"
                : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {items.map((item) => (
              <WishlistCard
                key={item._id}
                item={item}
                viewMode={viewMode}
                onRemove={handleRemove}
                onBuy={handleBuy}
                disabled={removing}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

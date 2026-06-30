import React, { useState } from "react";
import { useSignupMutation } from "../../../core/api/endpoints/authApi";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpg";
import sideImage from "../../../assets/sideImage.jpg";

export default function Signup() {
  const [signup, { isLoading }] = useSignupMutation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    acceptedPolicies: false,
  });

  const [error, setError] = useState("");

  /* ========================================
     🔥 HANDLE INPUT CHANGE (SAFE)
  ======================================== */
  const handleChange = (e) => {
    const { checked, name, type, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ========================================
     🚀 SUBMIT HANDLER
  ======================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ FRONTEND VALIDATION (FIXES YOUR ERROR)
    if (!form.name.trim()) {
      return setError("Name is required");
    }

    if (!form.email.trim()) {
      return setError("Email is required");
    }

    if (!form.password.trim()) {
      return setError("Password is required");
    }

    if (!form.acceptedPolicies) {
      return setError("Please accept the Terms, Privacy Policy, and Refund Policy");
    }

    try {
      const payload = {
        name: form.name.trim(), // 🔥 IMPORTANT FIX
        email: form.email.trim(),
        phone: form.phone ? String(form.phone) : "",
        password: form.password,
        acceptedPolicies: form.acceptedPolicies,
      };

      console.log("FINAL PAYLOAD:", payload);

      await signup(payload).unwrap();

      navigate("/login");
    } catch (err) {
      setError(err?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#fdecec] via-[#f7f5f9] to-[#eef2f7]">

      {/* LEFT SIDE */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-24 sm:px-10 lg:w-1/2">

        {/* LOGO */}
        <img
          src={logo}
          alt="logo"
          className="absolute left-6 top-6 h-12 object-contain cursor-pointer sm:left-10"
          onClick={() => navigate("/")}
        />

        {/* CARD */}
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-md sm:p-10">

          <h2 className="text-xl font-semibold mb-1">
            Your Knowledge Business, On Autopilot!
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            Start free in 2 minutes, no credit card needed
          </p>

          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NAME */}
            <input
              name="name"
              value={form.name}
              placeholder="Enter Your Name"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange}
            />

            {/* EMAIL */}
            <input
              name="email"
              value={form.email}
              type="email"
              placeholder="Enter Your Email"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange}
            />

            {/* PHONE */}
            <div className="grid grid-cols-[72px_1fr] gap-2 sm:grid-cols-[80px_1fr]">
              <input
                value="+91"
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100 p-3 text-gray-500"
              />
              <input
                name="phone"
                value={form.phone}
                placeholder="Enter Phone Number"
                type="tel"
                className="min-w-0 rounded-lg border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={handleChange}
              />
            </div>

            {/* PASSWORD */}
            <input
              name="password"
              value={form.password}
              type="password"
              placeholder="Enter Password"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange}
            />

            <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-left text-xs leading-5 text-gray-600">
              <input
                type="checkbox"
                name="acceptedPolicies"
                checked={form.acceptedPolicies}
                onChange={handleChange}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms-and-conditions" className="font-semibold text-indigo-600 hover:underline">
                  Terms and Conditions
                </Link>
                ,{" "}
                <Link to="/privacy-policy" className="font-semibold text-indigo-600 hover:underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link to="/refund-and-return-policy" className="font-semibold text-indigo-600 hover:underline">
                  Refund and Return Policy
                </Link>
                .
              </span>
            </label>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90 transition text-white p-3 rounded-full font-semibold"
            >
              {isLoading ? "Please wait..." : "Get Started for Free"}
            </button>

          </form>

          {/* LOGIN */}
          <p className="text-center text-sm mt-5 text-gray-500">
            Already have an account?{" "}
            <span
              className="text-indigo-600 font-medium cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Log in
            </span>
          </p>

          {/* TERMS */}
          <p className="text-xs text-gray-400 mt-4 text-center">
            Your consent is stored securely with your account.
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden min-h-screen w-1/2 flex-col items-center justify-center px-10 lg:flex">

        <h2 className="text-3xl font-semibold mb-8 text-center">
          Your Business,{" "}
          <span className="text-orange-500">Run by AI</span>
        </h2>

        <img
          src={sideImage}
          alt="side"
          className="rounded-xl shadow-md w-[350px] object-cover"
        />

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-3">
            Trusted by 2,00,000+ creators
          </p>

          <div className="flex justify-center -space-x-3">
            <img src="https://i.pravatar.cc/40?img=1" className="w-10 h-10 rounded-full border-2 border-white" />
            <img src="https://i.pravatar.cc/40?img=2" className="w-10 h-10 rounded-full border-2 border-white" />
            <img src="https://i.pravatar.cc/40?img=3" className="w-10 h-10 rounded-full border-2 border-white" />
            <img src="https://i.pravatar.cc/40?img=4" className="w-10 h-10 rounded-full border-2 border-white" />
          </div>
        </div>

      </div>
    </div>
  );
}

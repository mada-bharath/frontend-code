import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useVerifyOtpMutation, useSendOtpMutation } from "../../../core/api/endpoints/authApi";
import useOtpTimer from "../../../hooks/useOtpTimer";
import { useToast } from "../../../core/providers/ToastProvider";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 📱 phone from login page
  const phone = location.state?.phone;

  // ⏱ timer (60 sec)
  const { time, resetTimer } = useOtpTimer(60);

  // 🔥 RTK Query hooks
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [sendOtp] = useSendOtpMutation();

  /* ========================================
     🔐 VERIFY OTP
  ======================================== */
  const handleVerify = async () => {
    if (!otp) {
      return showToast("Enter OTP", "error");
    }

    try {
      const res = await verifyOtp({ phone, otp }).unwrap();

      // ✅ save token
      const token =
        res?.token ||
        res?.data?.token ||
        res?.accessToken;

      const user =
        res?.user ||
        res?.data?.user ||
        res?.data;

      if (!token) {
        return showToast("Token missing", "error");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      showToast("Login successful ✅");

      navigate("/courses");

    } catch (err) {
      showToast(err?.data?.message || "Invalid OTP", "error");
    }
  };

  /* ========================================
     🔁 RESEND OTP (PHONE)
  ======================================== */
  const handleResend = async () => {
    try {
      await sendOtp({ phone }).unwrap();

      showToast("OTP resent successfully 📱");
      resetTimer();

    } catch (err) {
      showToast("Failed to resend OTP", "error");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-6 rounded shadow w-80">

        <h2 className="text-xl font-bold mb-4">
          Verify OTP
        </h2>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full border p-2 mb-4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleVerify}
          className="bg-green-500 text-white w-full p-2 rounded"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* ⏱ Timer / Resend */}
        <p className="text-center mt-3">
          {time > 0 ? (
            <span>Resend in {time}s</span>
          ) : (
            <button
              onClick={handleResend}
              className="text-blue-600"
            >
              Resend OTP
            </button>
          )}
        </p>

      </div>
    </div>
  );
}
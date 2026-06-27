import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../../../core/api/endpoints/authApi";
import { useToast } from "../../../core/providers/ToastProvider";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async () => {
    try {
      await forgotPassword({ email }).unwrap();

      localStorage.setItem("email", email);
      showToast("OTP sent to email");

      navigate("/verify-otp");
    } catch (err) {
      showToast(err?.data?.message || "User not found", "error");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="p-6 bg-white shadow rounded w-80">
        <h2 className="text-xl mb-4">Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter Email"
          className="w-full p-2 border mb-3"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {isLoading ? "Sending..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}

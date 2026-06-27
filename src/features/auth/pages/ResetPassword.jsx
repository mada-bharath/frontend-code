import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResetPasswordMutation } from "../../../core/api/endpoints/authApi";
import { useToast } from "../../../core/providers/ToastProvider";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const email = localStorage.getItem("email");

  const handleReset = async () => {
    try {
      await resetPassword({
        email,
        password,
      }).unwrap();

      showToast("Password updated");
      navigate("/login");
    } catch (err) {
      showToast(err?.data?.message || "Error resetting password", "error");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="p-6 bg-white shadow rounded w-80">
        <h2 className="text-xl mb-4">Reset Password</h2>

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 border mb-3"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={isLoading}
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

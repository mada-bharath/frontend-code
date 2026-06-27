import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "../../../core/api/endpoints/authApi";
import { useAuth } from "../../../core/providers/AuthProvider";
import logo from "../../../assets/logo.jpg";
import sideImage from "../../../assets/sideImage.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginUser, { isLoading }] = useLoginMutation();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setError("");

      const res = await loginUser({ email, password }).unwrap();
      const token = res?.token || res?.data?.token || res?.accessToken;
      const userData = res?.user || res?.data?.user || res?.data;

      const redirectPath = searchParams.get("redirect");
      const result = login(token, userData, null, redirectPath);

      if (!result.success) {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError(err?.data?.message || "Login failed");
    }
  };

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-[#fdecec] via-[#f7f5f9] to-[#eef2f7] text-slate-950">
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-24 sm:px-10 lg:w-1/2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute left-6 top-6 h-12 w-14 overflow-hidden rounded-sm bg-[#111] shadow-sm sm:left-10"
          aria-label="Go to home"
        >
          <img src={logo} alt="Bharath Vidya" className="h-full w-full object-cover" />
        </button>

        <form
          onSubmit={handleLogin}
          className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-md sm:p-10"
        >
          <h1 className="text-xl font-semibold leading-snug">
            Welcome Back to Bharath Vidya
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Continue learning from where you left off
          </p>

          {error && <p className="mt-5 text-sm font-medium text-red-500">{error}</p>}

          <div className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Enter Your Email"
              className="h-12 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="Enter Password"
              className="h-12 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Please wait..." : "Login"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="font-medium text-indigo-600"
            >
              Sign up
            </button>
          </p>
        </form>
      </section>

      <section className="hidden min-h-screen w-1/2 flex-col items-center justify-center px-10 lg:flex">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          Your Business, <span className="text-orange-500">Run by AI</span>
        </h2>

        <img
          src={sideImage}
          alt="Learning courses preview"
          className="w-[350px] rounded-xl object-cover shadow-md"
        />

        <div className="mt-12 text-center">
          <p className="mb-3 text-gray-600">Trusted by 2,00,000+ creators</p>

          <div className="flex justify-center -space-x-3">
            {[1, 2, 3, 4].map((item) => (
              <img
                key={item}
                src={`https://i.pravatar.cc/40?img=${item}`}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

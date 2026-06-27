import Navbar from "../../../design-system/layouts/Navbar";
import { Rocket } from "lucide-react";

export default function LevelUp() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 pt-16">
        <section className="w-full rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Rocket size={30} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Level Up</h1>
          <p className="mt-3 text-lg font-medium text-slate-500">
            Coming soon
          </p>
        </section>
      </main>
    </div>
  );
}

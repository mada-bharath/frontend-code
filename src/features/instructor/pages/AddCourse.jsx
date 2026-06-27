/**
 * =========================================================
 * 🎓 ADD COURSE PAGE (RTK QUERY - FINAL 🔥)
 * =========================================================
 * ✅ No axios (RTK Query)
 * ✅ Clean production logic
 * ✅ Safe error handling
 * ✅ Same UI (no change)
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// 🔥 RTK QUERY
import { useCreateCourseMutation } from "../../../core/api/endpoints/courseApi";

export default function AddCourse() {
  const navigate = useNavigate();

  // 🔥 FORM STATE
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: "",
  });

  // 🔥 API
  const [createCourse, { isLoading }] = useCreateCourseMutation();

  /**
   * 📝 HANDLE INPUT
   */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * 📤 CREATE COURSE (DRAFT)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createCourse(form).unwrap();

      alert("✅ Course created as draft");

      // 🔥 NAVIGATE (BETTER THAN window.location)
      navigate("/instructor/dashboard");

    } catch (error) {
      console.error("❌ Create Course Error:", error);
      alert(
        error?.data?.message || "Error creating course"
      );
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Add New Course
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-4"
      >

        {/* TITLE */}
        <input
          type="text"
          name="title"
          placeholder="Course Title"
          value={form.title}
          onChange={handleChange}
          className="w-full border p-3 rounded"
          required
        />

        {/* DESCRIPTION */}
        <textarea
          name="description"
          placeholder="Course Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-3 rounded"
          required
        />

        {/* PRICE */}
        <input
          type="number"
          name="price"
          placeholder="Course Price"
          value={form.price}
          onChange={handleChange}
          className="w-full border p-3 rounded"
          required
        />

        {/* THUMBNAIL */}
        <input
          type="text"
          name="thumbnail"
          placeholder="Thumbnail URL"
          value={form.thumbnail}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {isLoading ? "Creating..." : "Create Course"}
        </button>

      </form>

    </div>
  );
}
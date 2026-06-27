import React from "react";

/**
 * 🧠 COURSE HEADER
 */

export default function CourseHeader({ course }) {
  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg mb-4">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="text-gray-300 mt-2">{course.description}</p>

      <div className="mt-3 text-sm">
        ⭐ {course.rating} | 👨‍🎓 {course.students} students
      </div>
    </div>
  );
}
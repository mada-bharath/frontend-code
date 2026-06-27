import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * 💳 STICKY SIDEBAR (BUY CARD)
 */

export default function CourseSidebar({ course, isPurchased }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-20 p-4 shadow-lg rounded-xl bg-white">
      <img
        src={course.thumbnail}
        alt="course"
        className="rounded mb-3"
      />

      <h2 className="text-xl font-bold">₹{course.price}</h2>

      {isPurchased ? (
        <button className="w-full bg-green-600 text-white py-2 mt-3 rounded">
          Continue Learning
        </button>
      ) : (
        <button
          onClick={() => navigate(`/checkout/${course._id}`)}
          className="w-full bg-blue-600 text-white py-2 mt-3 rounded"
        >
          Buy Now
        </button>
      )}
    </div>
  );
}
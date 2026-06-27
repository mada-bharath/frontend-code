import { useMemo } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";

/**
 * 🔥 PRODUCTION COURSE FILTER HOOK
 *
 * ✅ Role-based filtering
 * ✅ Safe optional chaining
 * ✅ Handles edge cases
 * ✅ Memoized (performance)
 * ✅ Scalable for future rules
 */

export const useCourseFilter = (courses = []) => {
  const { user, isInstructor, isAdmin } = useAuth();

  return useMemo(() => {
    if (!courses || !Array.isArray(courses)) return [];

    // 🛠 ADMIN → see everything
    if (isAdmin()) {
      return courses;
    }

    // 👨‍🏫 INSTRUCTOR LOGIC
    if (isInstructor()) {
      return courses.filter((course) => {
        const isOwner = course?.createdBy === user?._id;
        const isFree = Number(course?.price || 0) === 0;

        return isOwner && isFree;
      });
    }

    // 👨‍🎓 STUDENT LOGIC
    return courses.filter((course) => {
      // Show all public courses
      return course?.isPublished !== false;
    });

  }, [courses, user, isInstructor, isAdmin]);
};
import { useState } from "react";
import {
  useGetAdminCoursesQuery,
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useUpdateCourseMutation,
} from "../../../core/api/endpoints/courseApi";
import {
  useUpdateAdminCourseStatusMutation,
} from "../../../core/api/endpoints/adminApi";
import toast from "react-hot-toast";

export default function ManageCourses() {
  const { data, isLoading, isError, refetch } = useGetAdminCoursesQuery();

  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [updateStatus] = useUpdateAdminCourseStatusMutation();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: null,
  });

  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Only image files allowed");
    }

    setForm((prev) => ({ ...prev, thumbnail: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.price) {
      return toast.error("All fields required");
    }

    try {
      await createCourse(form).unwrap();

      toast.success("Course created");
      setForm({
        title: "",
        description: "",
        price: "",
        thumbnail: null,
      });
      setPreview(null);
      refetch();
    } catch {
      toast.error("Failed to create course");
    }
  };

  const openEdit = (course) => {
    setEditing(course._id);
    setEditForm(course);
  };

  const handleUpdate = async () => {
    try {
      await updateCourse({
        id: editing,
        data: editForm,
      }).unwrap();

      toast.success("Course updated");
      setEditing(null);
      refetch();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Course ${status}`);
      refetch();
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await deleteCourse(id).unwrap();
      toast.success("Course deleted");
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Error loading</p>;

  const courses = data?.data || [];

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-bold">Create Course</h2>

        <input
          placeholder="Title"
          className="input w-full"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="input w-full"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          type="number"
          placeholder="Price"
          className="input w-full"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <input type="file" onChange={handleFile} />

        {preview && (
          <img src={preview} className="w-40 h-24 object-cover rounded" />
        )}

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {creating ? "Creating..." : "Create Course"}
        </button>
      </form>

      <div className="grid md:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course._id} className="bg-white rounded shadow">
            <img
              src={course.thumbnail || "/placeholder.jpg"}
              className="h-40 w-full object-cover"
            />

            <div className="p-4 space-y-2">
              <h3>{course.title}</h3>
              <p>Rs. {course.finalPrice}</p>
              <p>Status: {course.status}</p>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => openEdit(course)}>Edit</button>
                <button onClick={() => handleStatus(course._id, "approved")}>
                  Approve
                </button>
                <button onClick={() => handleStatus(course._id, "rejected")}>
                  Reject
                </button>
                <button onClick={() => handleDeleteCourse(course._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import Login from "../features/auth/pages/Login";
import Signup from "../features/auth/pages/Signup";

export default function publicRoutes(user) {
  return [
    {
      path: "/login",
      element: !user ? <Login /> : <Navigate to="/courses" replace />,
    },
    {
      path: "/signup",
      element: !user ? <Signup /> : <Navigate to="/courses" replace />,
    },
  ];
}
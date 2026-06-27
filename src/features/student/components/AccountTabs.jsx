import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  {
    label: "Overview",
    path: "/profile",
    matches: ["/profile", "/account"],
  },
  {
    label: "Billing",
    path: "/billing",
    matches: [
      "/billing",
      "/profile/billing",
      "/account/billing",
      "/purchases",
      "/profile/purchases",
      "/account/purchases",
    ],
  },
  {
    label: "Change Password",
    path: "/profile/password",
    matches: ["/profile/password", "/account/password"],
  },
];

const isActiveTab = (pathname, tab) => {
  if (pathname === "/profile/personal" || pathname === "/profile/contact") {
    return false;
  }

  if (tab.path === "/profile") {
    return pathname === "/profile" || pathname === "/account";
  }

  return tab.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
};

export default function AccountTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="overflow-x-auto border-b border-[#dbe3ef]">
      <div className="flex min-w-max items-center">
        {tabs.map((tab, index) => {
          const active = isActiveTab(pathname, tab);

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              style={{ marginRight: index === tabs.length - 1 ? 0 : 42 }}
              className={`relative h-14 shrink-0 text-base font-bold transition ${
                active ? "text-black" : "text-[#65718a] hover:text-black"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-black" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

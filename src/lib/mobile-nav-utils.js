function mobileNavItems(isAdmin = false) {
  const items = [
    { href: "/", label: "Home", showLabel: false },
    { href: "/search", label: "Search", showLabel: false },
    { href: "/saves", label: "Saves", showLabel: false },
    { href: "/profile", label: "Profile", showLabel: false },
  ];
  // The publishing dashboard is a private tool.  Put it in the phone dock
  // only after the signed-in account has been verified as an administrator.
  if (isAdmin) items.push({ href: "/admin", label: "Admin dashboard", showLabel: false });
  return items;
}

module.exports = { mobileNavItems };

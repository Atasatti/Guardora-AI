// The owner is named by SUPER_ADMIN_EMAIL rather than by the database, so no
// one can demote, deactivate or edit them through the app. Every other
// administrator is a user with role ADMIN, granted and revoked by the owner.

export const superAdminEmail = () =>
  String(process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();

export const isSuperAdminEmail = (email) => {
  const owner = superAdminEmail();
  return Boolean(owner) && String(email || "").trim().toLowerCase() === owner;
};

export const isSuperAdmin = (user) => isSuperAdminEmail(user?.email);

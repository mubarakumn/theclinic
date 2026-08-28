import { useState, useEffect } from "react";
import { Plus, Edit2, UserCheck, UserX, KeyRound } from "lucide-react";
import Modal from "../../components/Modal";
import API from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../routes/roles";

export default function Users() {
  const { user } = useAuth();
  const currentUserRole = user?.role?.toUpperCase();
  const isAdmin =
    currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.SUPER_ADMIN;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filter out system roles if needed, use normalized backend enum list
  const availableRoles = [
    ROLES.ADMIN,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.PHARMACIST,
    ROLES.LAB_TECH,
    ROLES.RADIOLOGIST,
    ROLES.ACCOUNTANT,
    ROLES.RECEPTIONIST,
  ];

  // Form states
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: ROLES.RECEPTIONIST,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Password reset modal states
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/users");
      // Flexibly handle various API payload formats
      const fetchedList =
        data?.users || data?.data || (Array.isArray(data) ? data : []);
      setUsers(fetchedList);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      alert(err.response?.data?.message || "Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (targetUser = null) => {
    if (targetUser) {
      setForm({
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email || "",
        phone: targetUser.phone || "",
        password: "",
        role: targetUser.role?.toUpperCase() || ROLES.RECEPTIONIST,
      });
      setEditingId(targetUser._id || targetUser.id);
    } else {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: ROLES.RECEPTIONIST,
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const updatePayload = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          role: form.role,
        };
        await API.patch(`/users/${editingId}`, updatePayload);
        alert("Staff user updated successfully");
      } else {
        await API.post("/users", form);
        alert("Staff account created successfully");
      }
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save user account");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetModal = (targetUser) => {
    setResetUser(targetUser);
    setNewPassword("");
    setIsResetModalOpen(true);
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    const targetId = resetUser?._id || resetUser?.id;
    try {
      await API.patch(`/users/${targetId}/reset-password`, {
        newPassword,
      });
      alert(
        `Password for ${resetUser.name || resetUser.email} reset successfully.`,
      );
      setIsResetModalOpen(false);
      setResetUser(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password.");
    }
  };

  const handleToggleStatus = async (targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    const isCurrentlyActive = targetUser.isActive ?? true;
    const action = isCurrentlyActive ? "deactivate" : "activate";

    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await API.patch(`/users/${targetId}/status`, {
          isActive: !isCurrentlyActive,
        });
        alert(`User ${action}d successfully`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || `Failed to ${action} user`);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-sm text-gray-500">
            Manage clinic user accounts, roles, and security credentials.
          </p>
        </div>
        {isAdmin && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm text-sm font-medium"
            onClick={() => handleOpenModal()}
          >
            <Plus size={16} />
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Loading staff records...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((item) => {
                const userId = item._id || item.id;
                const activeState = item.isActive ?? true;

                return (
                  <tr key={userId} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">
                      {item.firstName || "N/A"} {item.lastName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{item.email}</div>
                      <div className="text-xs text-gray-400">
                        {item.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 uppercase">
                        {item.role?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          activeState
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {activeState ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <button
                              title="Edit Staff"
                              className="p-1.5 text-gray-500 hover:text-slate-900 rounded-md hover:bg-gray-100 transition-colors"
                              onClick={() => handleOpenModal(item)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              title="Reset Password"
                              className="p-1.5 text-amber-600 hover:text-amber-800 rounded-md hover:bg-amber-50 transition-colors"
                              onClick={() => handleOpenResetModal(item)}
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              title={
                                activeState
                                  ? "Deactivate User"
                                  : "Activate User"
                              }
                              className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${
                                activeState
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              }`}
                              onClick={() => handleToggleStatus(item)}
                            >
                              {activeState ? (
                                <UserX size={16} />
                              ) : (
                                <UserCheck size={16} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No staff records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Main Staff Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Staff Details" : "Create Staff Member"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex gap-2 ">
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {!editingId && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Role
            </label>
            <select
              name="role"
              className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? "Update Account" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password for ${resetUser?.name || resetUser?.email || ""}`}
      >
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            Enter a new temporary password for{" "}
            <strong>{resetUser?.email}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
            >
              Reset Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

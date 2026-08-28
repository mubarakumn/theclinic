import { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import API from "../../api";
import { useAuth } from "../../contexts/AuthContext";

export default function RolePermissions() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch roles and permissions in parallel
        const [rolesRes, permissionsRes] = await Promise.all([
          API.get("/roles"),
          API.get("/roles/permissions"),
        ]);

        if (rolesRes.data.success) {
          setRoles(rolesRes.data.roles);
          // Set an initial role for editing
          if (rolesRes.data.roles.length > 0) {
            handleRoleSelect(rolesRes.data.roles[0]);
          }
        }

        if (permissionsRes.data.success) {
          setAllPermissions(permissionsRes.data.permissions);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch roles or permissions.",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEditingPermissions([...role.permissions]);
  };

  const handlePermissionChange = (permission, isChecked) => {
    if (isChecked) {
      setEditingPermissions((prev) => [...prev, permission]);
    } else {
      setEditingPermissions((prev) => prev.filter((p) => p !== permission));
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const { data } = await API.put(`/roles/${selectedRole.name}`, {
        permissions: editingPermissions,
      });
      if (data.success) {
        // Update the local state to reflect the change without a full refetch
        setRoles(roles.map((r) => (r.name === data.role.name ? data.role : r)));
        setSelectedRole(data.role);
        alert("Permissions updated successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save changes.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center p-10">Loading roles...</div>;
  if (error)
    return (
      <div className="text-center p-10 text-red-500 flex justify-center items-center gap-2">
        <AlertCircle /> {error}
      </div>
    );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Roles & Permissions
        </h1>
      </div>
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg">
        Use this page to manage the capabilities assigned to each system role. Changes are applied in real-time across the application.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3">System Roles</h3>
          <ul className="space-y-1">
            {roles.map((role) => (
              <li key={role.name}>
                <button
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize ${
                    selectedRole?.name === role.name
                      ? "bg-slate-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {role.name.replace("_", " ")}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Permissions Editor */}
        <div className="md:col-span-3 bg-white rounded-lg shadow p-6">
          {selectedRole ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 capitalize flex items-center gap-2">
                <ShieldCheck className="text-blue-600" />
                {selectedRole.name.replace("_", " ")}
              </h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                {selectedRole.description}
              </p>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-4">
                  Manage Capabilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allPermissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center space-x-3"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                        checked={editingPermissions.includes(permission)}
                        onChange={(e) =>
                          handlePermissionChange(permission, e.target.checked)
                        }
                      />
                      <span className="text-sm text-gray-700">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {hasPermission("roles.manage") && (
                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-900 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500">
              Select a role to manage its permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

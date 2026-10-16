import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import API from "../../api"; // Assuming API client exists
import { useDebounce } from "../../hooks/useDebounce"; 

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({ actor: "", action: "" });
  const debouncedFilters = useDebounce(filters, 500);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...debouncedFilters,
      };
      // Remove empty filters
      if (!params.actor) delete params.actor;
      if (!params.action) delete params.action;

      const { data } = await API.get("/audit-logs", { params });
      console.log("logs:", data);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch audit logs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination, debouncedFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchLogs(newPage);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
      </div>

      {/* Filter Section */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          name="actor"
          placeholder="Filter by Actor (e.g., user name)"
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
          value={filters.actor}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="action"
          placeholder="Filter by Action (e.g., USER_CREATED)"
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
          value={filters.action}
          onChange={handleFilterChange}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-8">Loading logs...</td></tr>
            ) : error ? (
              <tr><td colSpan="4" className="text-center py-8 text-red-500 flex justify-center items-center gap-2"><AlertCircle /> {error}</td></tr>
            ) : logs?.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-500">No audit logs found for the selected filters.</td></tr>
            ) : (
              logs?.map((log) => (
                <tr key={log._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.actorName || "System"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{log.action}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination?.total > 0 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages} (Total: {pagination.total} logs)
          </span>
          <div className="flex gap-2">
            <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages || loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

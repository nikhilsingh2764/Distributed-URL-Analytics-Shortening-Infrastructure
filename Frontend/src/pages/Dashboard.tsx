import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Copy, ExternalLink, BarChart2, Plus } from 'lucide-react';

interface URLItem {
  _id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
}

export default function Dashboard() {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUrls = async () => {
    try {
      const res = await api.get('/url');
      setUrls(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/url/shorten', { originalUrl, customAlias });
      setOriginalUrl('');
      setCustomAlias('');
      fetchUrls();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Shorten Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Shorten a Long URL</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
        <form onSubmit={handleShorten} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="url"
            placeholder="Paste long URL (e.g., https://example.com)"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <input
            type="text"
            placeholder="Custom Alias (Optional)"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-3 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Shorten URL'}</span>
          </button>
        </form>
      </div>

      {/* URL List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Your Short Links</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {urls.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No short links created yet.</div>
          ) : (
            urls.map((u) => (
              <div key={u._id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-blue-600">{u.shortCode}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(`http://localhost:5000/${u.shortCode}`)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{u.originalUrl}</p>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-slate-600 font-medium">{u.clicks || 0} clicks</span>
                  <Link
                    to={`/analytics/${u.shortCode}`}
                    className="flex items-center space-x-1 text-slate-600 hover:text-blue-600"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
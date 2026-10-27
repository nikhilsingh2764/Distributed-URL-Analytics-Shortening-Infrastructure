import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, MousePointer, Globe, Calendar } from 'lucide-react';

export default function Analytics() {
  const { shortId } = useParams();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/url/analytics/${shortId}`)
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [shortId]);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Analytics for /{shortId}</h2>
        <p className="text-sm text-slate-500 mb-6">{stats?.originalUrl}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center space-x-4">
            <MousePointer className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.totalClicks || 0}</p>
              <p className="text-xs text-slate-500">Total Clicks</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center space-x-4">
            <Globe className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.uniqueVisitors || 0}</p>
              <p className="text-xs text-slate-500">Unique Visitors</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center space-x-4">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {stats?.createdAt ? new Date(stats.createdAt).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-xs text-slate-500">Created Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
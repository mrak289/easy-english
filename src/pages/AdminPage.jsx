import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'mrak28@gmail.com';

function StatCard({ icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center space-x-3">
        <i className={`fa-solid ${icon} text-xl`}></i>
        <div>
          <p className="text-xs opacity-70 font-medium">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // key being edited
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/settings', { credentials: 'include' });
      const data = await r.json();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (s) => {
    setEditing(s.key);
    setEditValue('');
    setMsg(null);
  };

  const save = async (key) => {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValue }),
      });
      if (r.ok) {
        setMsg({ type: 'ok', text: 'Збережено' });
        setEditing(null);
        load();
      } else {
        const e = await r.json();
        setMsg({ type: 'err', text: e.error });
      }
    } finally {
      setSaving(false);
    }
  };

  const LABELS = {
    GEMINI_API_KEY: { label: 'Gemini API Key', icon: 'fa-wand-magic-sparkles', desc: 'Google AI Studio → API Keys' },
  };

  if (loading) return <div className="text-slate-500 text-sm py-6 text-center">Завантаження...</div>;

  return (
    <div className="space-y-3">
      {msg && (
        <div className={`text-xs px-3 py-2 rounded-lg ${msg.type === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {msg.text}
        </div>
      )}
      {settings.map(s => {
        const meta = LABELS[s.key] || { label: s.key, icon: 'fa-key', desc: '' };
        return (
          <div key={s.key} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-slate-700 rounded-lg p-2 shrink-0">
                  <i className={`fa-solid ${meta.icon} text-slate-300`}></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{meta.label}</p>
                  {meta.desc && <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>}
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {s.hasValue ? s.value : <span className="text-amber-500">не встановлено</span>}
                  </p>
                  {s.updated_at && s.hasValue && (
                    <p className="text-xs text-slate-600 mt-0.5">Оновлено: {new Date(s.updated_at).toLocaleString('uk')}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => editing === s.key ? setEditing(null) : startEdit(s)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition font-medium"
              >
                {editing === s.key ? 'Скасувати' : 'Змінити'}
              </button>
            </div>

            {editing === s.key && (
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Вставте новий ключ..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button
                  onClick={() => save(s.key)}
                  disabled={saving || !editValue}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
                >
                  {saving ? '...' : 'Зберегти'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/users', { credentials: 'include' });
      setUsers(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (user) => {
    setToggling(user.id);
    try {
      await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !user.is_blocked }),
      });
      await load();
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm py-6 text-center">Завантаження...</div>;

  const total = users.length;
  const blocked = users.filter(u => u.is_blocked).length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon="fa-users" label="Всього" value={total} color="indigo" />
        <StatCard icon="fa-user-check" label="Активних" value={total - blocked} color="green" />
        <StatCard icon="fa-ban" label="Заблоковано" value={blocked} color="red" />
      </div>

      <div className="space-y-2">
        {users.map(u => (
          <div
            key={u.id}
            className={`flex items-center gap-4 p-3 rounded-xl border transition ${
              u.is_blocked
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <div className="relative shrink-0">
              {u.avatar_url
                ? <img src={u.avatar_url} alt={u.name} className={`w-9 h-9 rounded-full ${u.is_blocked ? 'opacity-40 grayscale' : ''}`} />
                : <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold">{u.name?.[0]}</div>
              }
              {u.email === ADMIN_EMAIL && (
                <span className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-4 h-4 flex items-center justify-center">
                  <i className="fa-solid fa-crown text-[8px] text-white"></i>
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold truncate ${u.is_blocked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {u.name}
                </p>
                {u.is_blocked && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">BLOCKED</span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{u.email}</p>
              <p className="text-xs text-slate-600">
                Реєстрація: {new Date(u.created_at).toLocaleDateString('uk')}
                {u.last_login_at && ` · Вхід: ${new Date(u.last_login_at).toLocaleDateString('uk')}`}
              </p>
            </div>

            {u.email !== ADMIN_EMAIL && (
              <button
                onClick={() => toggleBlock(u)}
                disabled={toggling === u.id}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  u.is_blocked
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                }`}
              >
                {toggling === u.id ? '...' : u.is_blocked ? 'Розблокувати' : 'Заблокувати'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');

  useEffect(() => {
    if (user === null) navigate('/');
    if (user && user.email !== ADMIN_EMAIL) navigate('/');
  }, [user, navigate]);

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const tabs = [
    { id: 'users', label: 'Користувачі', icon: 'fa-users' },
    { id: 'settings', label: 'Налаштування', icon: 'fa-sliders' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-lg">
              <i className="fa-solid fa-shield-halved text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 tracking-tight">Адмін-панель</h1>
              <p className="text-xs text-slate-500">SimpliLang · {user.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i>
            До сайту
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800 mb-8 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className={`fa-solid ${t.icon} text-xs`}></i>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

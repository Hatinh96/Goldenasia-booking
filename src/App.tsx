import {type FormEvent, useCallback, useEffect, useMemo, useState} from 'react';
import {
  BarChart3,
  Building2,
  CalendarClock,
  Clock3,
  Database,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {demoBookings, demoCampaigns, demoLocations, demoScreens} from './lib/demo-data';
import {hasSupabaseEnv, supabase} from './lib/supabase';
import type {
  BookingRow,
  BookingStatus,
  CampaignRow,
  CampaignStatus,
  ChannelType,
  LocationRow,
  LocationStatus,
  ScreenRow,
  ScreenStatus,
} from './types/models';

type LocationForm = {
  code: string;
  name: string;
  channel: ChannelType;
  region: string;
};

type CampaignForm = {
  name: string;
  advertiser: string;
  budget: string;
  start_date: string;
  end_date: string;
};

type BookingForm = {
  location_id: string;
  campaign_id: string;
  start_at: string;
  end_at: string;
  spot_count: string;
  unit_price: string;
};

type ScreenForm = {
  location_id: string;
  screen_code: string;
  screen_type: string;
  model: string;
  slot_count: string;
  status: ScreenStatus;
};

const defaultChannels: ChannelType[] = ['University', 'Cafe', 'Fast Food', 'Mall', 'Office', 'Transit'];
const locationStatuses: LocationStatus[] = ['active', 'maintenance', 'inactive'];
const screenStatuses: ScreenStatus[] = ['active', 'maintenance', 'inactive'];
const campaignStatuses: CampaignStatus[] = ['draft', 'pending', 'active', 'paused', 'completed'];
const bookingStatuses: BookingStatus[] = ['pending', 'confirmed', 'live', 'done', 'cancelled'];
const channelStyle: Record<string, string> = {
  University: 'border-blue-200 bg-blue-100 text-blue-700',
  Cafe: 'border-amber-200 bg-amber-100 text-amber-700',
  'Fast Food': 'border-red-200 bg-red-100 text-red-700',
  Mall: 'border-purple-200 bg-purple-100 text-purple-700',
  Office: 'border-slate-200 bg-slate-100 text-slate-700',
  Transit: 'border-cyan-200 bg-cyan-100 text-cyan-700',
};
const getChannelStyle = (channel: string) =>
  channelStyle[channel] ?? 'border-slate-200 bg-slate-100 text-slate-700';
const campaignStyle = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  pending: 'border-amber-200 bg-amber-100 text-amber-700',
  active: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  paused: 'border-orange-200 bg-orange-100 text-orange-700',
  completed: 'border-blue-200 bg-blue-100 text-blue-700',
};
const bookingStyle = {
  pending: 'border-amber-200 bg-amber-100 text-amber-700',
  confirmed: 'border-blue-200 bg-blue-100 text-blue-700',
  live: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  done: 'border-slate-200 bg-slate-100 text-slate-700',
  cancelled: 'border-red-200 bg-red-100 text-red-700',
};

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
const dt = now.toISOString().slice(0, 16);

const l0: LocationForm = {code: '', name: '', channel: 'University', region: ''};
const c0: CampaignForm = {name: '', advertiser: '', budget: '50000000', start_date: '', end_date: ''};
const b0: BookingForm = {
  location_id: '',
  campaign_id: '',
  start_at: dt,
  end_at: dt,
  spot_count: '120',
  unit_price: '350000',
};

const s0: ScreenForm = {
  location_id: '',
  screen_code: '',
  screen_type: 'DP',
  model: '21.5" logo',
  slot_count: '32',
  status: 'active',
};

const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND', maximumFractionDigits: 0}).format(n);
const num = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
const msg = (e: unknown) => (e instanceof Error ? e.message : 'Unknown error');
const id = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `local-${Date.now()}`;

const isSlotActiveStatus = (status: BookingStatus) =>
  status === 'pending' || status === 'confirmed' || status === 'live';

const hasTimeOverlap = (aStartMs: number, aEndMs: number, bStartMs: number, bEndMs: number) =>
  aStartMs < bEndMs && bStartMs < aEndMs;

type SectionKey = 'dashboard' | 'locations' | 'campaigns' | 'bookings' | 'analytics';

const menuItems: {id: SectionKey; label: string; icon: typeof LayoutDashboard}[] = [
  {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
  {id: 'locations', label: 'Placement Network', icon: MapPin},
  {id: 'campaigns', label: 'Campaign Manager', icon: Sparkles},
  {id: 'bookings', label: 'Booking Desk', icon: CalendarClock},
  {id: 'analytics', label: 'Analytics', icon: BarChart3},
];

export default function App() {
  const demo = !hasSupabaseEnv || !supabase;
  const [q, setQ] = useState('');
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationRow[]>(demoLocations);
  const [screens, setScreens] = useState<ScreenRow[]>(demoScreens);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(demoCampaigns);
  const [bookings, setBookings] = useState<BookingRow[]>(demoBookings);
  const [channels, setChannels] = useState<ChannelType[]>(() => defaultChannels);
  const [newChannel, setNewChannel] = useState('');
  const [channelMode, setChannelMode] = useState<'existing' | 'new'>('existing');

  const [lf, setLf] = useState<LocationForm>(l0);
  const [sf, setSf] = useState<ScreenForm>(s0);
  const [sef, setSef] = useState<ScreenForm>(s0);
  const [editScreenId, setEditScreenId] = useState<string | null>(null);
  const [screenLocationFilter, setScreenLocationFilter] = useState<string>('all');
  const [cf, setCf] = useState<CampaignForm>(c0);
  const [bf, setBf] = useState<BookingForm>(b0);

  const pull = useCallback(async () => {
    if (demo || !supabase) return;
    setLoading(true);
    setErr(null);
    try {
      const [a, s, b, c] = await Promise.all([
        supabase.from('ad_locations').select('*').order('created_at', {ascending: false}),
        supabase.from('location_screens').select('*').order('created_at', {ascending: false}),
        supabase.from('campaigns').select('*').order('created_at', {ascending: false}),
        supabase.from('bookings').select('*').order('created_at', {ascending: false}),
      ]);
      if (a.error) throw a.error;
      if (s.error) throw s.error;
      if (b.error) throw b.error;
      if (c.error) throw c.error;
      setLocations((a.data ?? []) as LocationRow[]);
      setScreens((s.data ?? []) as ScreenRow[]);
      setCampaigns((b.data ?? []) as CampaignRow[]);
      setBookings((c.data ?? []) as BookingRow[]);
    } catch (e) {
      setErr(`Load failed: ${msg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [demo]);

  useEffect(() => {
    void pull();
  }, [pull]);

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(null), 2200);
    return () => clearTimeout(t);
  }, [ok]);

  useEffect(() => {
    setBf((p) => ({...p, location_id: locations[0]?.id ?? p.location_id}));
  }, [locations]);

  useEffect(() => {
    setSf((p) => ({...p, location_id: locations[0]?.id ?? p.location_id}));
  }, [locations]);

  useEffect(() => {
    if (screenLocationFilter !== 'all' && !locations.some((x) => x.id === screenLocationFilter)) {
      setScreenLocationFilter('all');
    }
  }, [locations, screenLocationFilter]);

  useEffect(() => {
    setBf((p) => ({...p, campaign_id: campaigns[0]?.id ?? p.campaign_id}));
  }, [campaigns]);

  useEffect(() => {
    setChannels((prev) => {
      const next: string[] = [];
      const seen = new Set<string>();
      for (const ch of [...defaultChannels, ...prev, ...locations.map((x) => x.channel)]) {
        const clean = ch.trim();
        if (!clean) continue;
        const key = clean.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(clean);
      }
      return next;
    });
  }, [locations]);

  const lMap = useMemo(() => new Map(locations.map((x) => [x.id, x])), [locations]);
  const cMap = useMemo(() => new Map(campaigns.map((x) => [x.id, x])), [campaigns]);

  const rows = useMemo(
    () =>
      bookings
        .map((b) => ({...b, loc: lMap.get(b.location_id), cam: cMap.get(b.campaign_id)}))
        .filter((x) =>
          [x.loc?.name ?? '', x.loc?.code ?? '', x.cam?.name ?? '', x.cam?.advertiser ?? '']
            .join(' ')
            .toLowerCase()
            .includes(q.toLowerCase()),
        ),
    [bookings, cMap, lMap, q],
  );

  const screenRows = useMemo(
    () =>
      screens
        .map((s) => ({...s, location: lMap.get(s.location_id)}))
        .filter((s) => screenLocationFilter === 'all' || s.location_id === screenLocationFilter)
        .filter((s) =>
          [
            s.screen_code,
            s.screen_type,
            s.model,
            s.location?.name ?? '',
            s.location?.code ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(q.toLowerCase()),
        ),
    [screens, lMap, q, screenLocationFilter],
  );

  const selectedLocation = useMemo(
    () => (screenLocationFilter === 'all' ? null : locations.find((x) => x.id === screenLocationFilter) ?? null),
    [locations, screenLocationFilter],
  );

  const normalizeScreenPayload = (form: ScreenForm) => ({
    location_id: form.location_id,
    screen_code: form.screen_code.trim().toUpperCase(),
    screen_type: form.screen_type.trim().toUpperCase(),
    model: form.model.trim(),
    slot_count: Number(form.slot_count),
    status: form.status,
  });

  const createChannelOption = () => {
    const clean = newChannel.trim();
    if (!clean) {
      setErr('Please enter channel name.');
      return;
    }
    const exists = channels.some((x) => x.toLowerCase() === clean.toLowerCase());
    if (exists) {
      const existingName = channels.find((x) => x.toLowerCase() === clean.toLowerCase()) ?? clean;
      setErr('Channel already exists.');
      setLf((prev) => ({...prev, channel: existingName}));
      setChannelMode('existing');
      return;
    }
    setChannels((prev) => [...prev, clean]);
    setLf((prev) => ({...prev, channel: clean}));
    setNewChannel('');
    setChannelMode('existing');
    setErr(null);
    setOk('Channel created.');
  };

  const kpi = useMemo(() => {
    const rev = bookings.reduce((s, b) => s + b.spot_count * b.unit_price, 0);
    const active = campaigns.filter((c) => c.status === 'active').length;
    const live = bookings.filter((b) => b.status === 'confirmed' || b.status === 'live').length;
    const occ = locations.length ? Math.round((new Set(bookings.map((b) => b.location_id)).size / locations.length) * 100) : 0;
    return {rev, active, live, occ};
  }, [bookings, campaigns, locations.length]);

  const addLocation = async (e: FormEvent) => {
    e.preventDefault();
    const p = {...lf, code: lf.code.trim().toUpperCase(), name: lf.name.trim(), region: lf.region.trim(), device_type: 'DP 21.5"', weekly_traffic: 10000, operating_hours: '06:00 - 22:00', status: 'active'};
    if (!p.code || !p.name || !p.region) return setErr('Location form missing fields.');
    setSaving(true);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('ad_locations').insert(p).select('*').single();
        if (r.error) throw r.error;
        setLocations((v) => [r.data as LocationRow, ...v]);
      } else {
        setLocations((v) => [{id: id(), created_at: new Date().toISOString(), ...p}, ...v]);
      }
      setLf(l0);
      setChannelMode('existing');
      setNewChannel('');
      setOk('Location created.');
    } catch (e2) {
      setErr(`Create location failed: ${msg(e2)}`);
    } finally {
      setSaving(false);
    }
  };

  const addScreen = async (e: FormEvent) => {
    e.preventDefault();
    const p = normalizeScreenPayload(sf);
    if (
      !p.location_id ||
      !p.screen_code ||
      !p.screen_type ||
      !p.model ||
      Number.isNaN(p.slot_count) ||
      p.slot_count <= 0
    ) {
      return setErr('Screen form missing fields.');
    }

    const duplicated = screens.some(
      (x) =>
        x.location_id === p.location_id &&
        x.screen_code.trim().toUpperCase() === p.screen_code.trim().toUpperCase(),
    );
    if (duplicated) return setErr('Screen code already exists in this location.');

    setSaving(true);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('location_screens').insert(p).select('*').single();
        if (r.error) throw r.error;
        setScreens((v) => [r.data as ScreenRow, ...v]);
      } else {
        setScreens((v) => [{id: id(), created_at: new Date().toISOString(), ...p}, ...v] as ScreenRow[]);
      }
      setSf((prev) => ({...s0, location_id: prev.location_id}));
      setOk('Screen created.');
    } catch (e2) {
      setErr(`Create screen failed: ${msg(e2)}`);
    } finally {
      setSaving(false);
    }
  };

  const beginEditScreen = (screen: ScreenRow) => {
    setErr(null);
    setEditScreenId(screen.id);
    setSef({
      location_id: screen.location_id,
      screen_code: screen.screen_code,
      screen_type: screen.screen_type,
      model: screen.model,
      slot_count: String(screen.slot_count),
      status: screen.status,
    });
  };

  const cancelEditScreen = () => {
    setEditScreenId(null);
    setSef(s0);
  };

  const addCampaign = async (e: FormEvent) => {
    e.preventDefault();
    const p = {...cf, name: cf.name.trim(), advertiser: cf.advertiser.trim(), objective: 'Campaign execution', budget: Number(cf.budget), status: 'draft'};
    if (!p.name || !p.advertiser || !p.start_date || !p.end_date) return setErr('Campaign form missing fields.');
    setSaving(true);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('campaigns').insert(p).select('*').single();
        if (r.error) throw r.error;
        setCampaigns((v) => [r.data as CampaignRow, ...v]);
      } else {
        setCampaigns((v) => [{id: id(), created_at: new Date().toISOString(), ...p}, ...v]);
      }
      setCf(c0);
      setOk('Campaign created.');
    } catch (e2) {
      setErr(`Create campaign failed: ${msg(e2)}`);
    } finally {
      setSaving(false);
    }
  };

  const addBooking = async (e: FormEvent) => {
    e.preventDefault();
    const p = {
      ...bf,
      start_at: new Date(bf.start_at).toISOString(),
      end_at: new Date(bf.end_at).toISOString(),
      spot_count: Number(bf.spot_count),
      unit_price: Number(bf.unit_price),
      status: 'pending',
      notes: null,
    };
    if (!p.location_id || !p.campaign_id) return setErr('Booking form missing fields.');

    const startMs = new Date(p.start_at).getTime();
    const endMs = new Date(p.end_at).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs >= endMs) {
      return setErr('Booking time range is invalid.');
    }

    const conflict = bookings.some((x) => {
      if (x.location_id !== p.location_id || !isSlotActiveStatus(x.status)) return false;
      return hasTimeOverlap(startMs, endMs, new Date(x.start_at).getTime(), new Date(x.end_at).getTime());
    });
    if (conflict) return setErr('Booking conflict: selected slot overlaps an existing active booking.');

    setSaving(true);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('bookings').insert(p).select('*').single();
        if (r.error) throw r.error;
        setBookings((v) => [r.data as BookingRow, ...v]);
      } else {
        setBookings((v) => [{id: id(), created_at: new Date().toISOString(), ...p}, ...v]);
      }
      setBf((x) => ({...b0, location_id: x.location_id, campaign_id: x.campaign_id}));
      setOk('Booking created.');
    } catch (e2) {
      setErr(`Create booking failed: ${msg(e2)}`);
    } finally {
      setSaving(false);
    }
  };

  const removeBooking = async (bookingId: string) => {
    if (!window.confirm('Delete this booking?')) return;
    setBusy(`del-${bookingId}`);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('bookings').delete().eq('id', bookingId);
        if (r.error) throw r.error;
      }
      setBookings((v) => v.filter((x) => x.id !== bookingId));
      setOk('Booking deleted.');
    } catch (e2) {
      setErr(`Delete booking failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const updateLocationStatus = async (locationId: string, status: LocationStatus) => {
    setBusy(`loc-${locationId}`);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('ad_locations').update({status}).eq('id', locationId);
        if (r.error) throw r.error;
      }
      setLocations((v) => v.map((x) => (x.id === locationId ? {...x, status} : x)));
      setOk('Location status updated.');
    } catch (e2) {
      setErr(`Update location failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const updateScreenStatus = async (screenId: string, status: ScreenStatus) => {
    setBusy(`screen-${screenId}`);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('location_screens').update({status}).eq('id', screenId);
        if (r.error) throw r.error;
      }
      setScreens((v) => v.map((x) => (x.id === screenId ? {...x, status} : x)));
      setOk('Screen status updated.');
    } catch (e2) {
      setErr(`Update screen failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const updateScreen = async (screenId: string) => {
    const p = normalizeScreenPayload(sef);
    if (
      !p.location_id ||
      !p.screen_code ||
      !p.screen_type ||
      !p.model ||
      Number.isNaN(p.slot_count) ||
      p.slot_count <= 0
    ) {
      return setErr('Screen form missing fields.');
    }

    const duplicated = screens.some(
      (x) =>
        x.id !== screenId &&
        x.location_id === p.location_id &&
        x.screen_code.trim().toUpperCase() === p.screen_code.trim().toUpperCase(),
    );
    if (duplicated) return setErr('Screen code already exists in this location.');

    setBusy(`screen-edit-${screenId}`);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('location_screens').update(p).eq('id', screenId).select('*').single();
        if (r.error) throw r.error;
        setScreens((v) => v.map((x) => (x.id === screenId ? (r.data as ScreenRow) : x)));
      } else {
        setScreens((v) => v.map((x) => (x.id === screenId ? {...x, ...p} : x)));
      }
      setEditScreenId(null);
      setSef(s0);
      setOk('Screen updated.');
    } catch (e2) {
      setErr(`Update screen failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const removeScreen = async (screenId: string) => {
    if (!window.confirm('Delete this screen?')) return;
    setBusy(`screen-del-${screenId}`);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('location_screens').delete().eq('id', screenId);
        if (r.error) throw r.error;
      }
      setScreens((v) => v.filter((x) => x.id !== screenId));
      if (editScreenId === screenId) {
        setEditScreenId(null);
        setSef(s0);
      }
      setOk('Screen deleted.');
    } catch (e2) {
      setErr(`Delete screen failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: CampaignStatus) => {
    setBusy(`cam-${campaignId}`);
    setErr(null);
    try {
      if (!demo && supabase) {
        const r = await supabase.from('campaigns').update({status}).eq('id', campaignId);
        if (r.error) throw r.error;
      }
      setCampaigns((v) => v.map((x) => (x.id === campaignId ? {...x, status} : x)));
      setOk('Campaign status updated.');
    } catch (e2) {
      setErr(`Update campaign failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBusy(`book-${bookingId}`);
    setErr(null);
    try {
      const current = bookings.find((x) => x.id === bookingId);
      if (!current) throw new Error('Booking not found.');
      if (isSlotActiveStatus(status)) {
        const currentStart = new Date(current.start_at).getTime();
        const currentEnd = new Date(current.end_at).getTime();
        const hasConflict = bookings.some((x) => {
          if (x.id === bookingId) return false;
          if (x.location_id !== current.location_id || !isSlotActiveStatus(x.status)) return false;
          return hasTimeOverlap(
            currentStart,
            currentEnd,
            new Date(x.start_at).getTime(),
            new Date(x.end_at).getTime(),
          );
        });
        if (hasConflict) {
          throw new Error('Cannot move booking to active status because time slot is already occupied.');
        }
      }
      if (!demo && supabase) {
        const r = await supabase.from('bookings').update({status}).eq('id', bookingId);
        if (r.error) throw r.error;
      }
      setBookings((v) => v.map((x) => (x.id === bookingId ? {...x, status} : x)));
      setOk('Booking status updated.');
    } catch (e2) {
      setErr(`Update booking failed: ${msg(e2)}`);
    } finally {
      setBusy(null);
    }
  };

  const goToSection = (section: SectionKey) => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#f8fafc_35%,_#f1f5f9)] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-800 bg-[#081a3c] text-slate-200 lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-700 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">OOH Booking Pro</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">Supabase Backend</p>
          </div>
        </div>
        <nav className="space-y-2 px-4 py-6 text-sm font-semibold">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goToSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/70'
                }`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
            <label className="relative flex-1 lg:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search placements, campaigns, bookings..."
                className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none ring-blue-300 focus:bg-white focus:ring-2"
              />
            </label>
            <button
              onClick={() => void pull()}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </header>

        <main className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${demo ? 'border-amber-200 bg-amber-100 text-amber-700' : 'border-emerald-200 bg-emerald-100 text-emerald-700'}`}>
              <Database className="h-3.5 w-3.5" />
              {demo ? 'Demo mode: add Supabase env vars to run live backend.' : 'Live mode: connected to Supabase.'}
            </p>
          </section>

          {err ? <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</section> : null}
          {ok ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{ok}</section> : null}

          <section
            id="dashboard"
            className={`${activeSection === 'dashboard' ? 'grid' : 'hidden'} gap-4 md:grid-cols-2 xl:grid-cols-4`}>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold">{money(kpi.rev)}</p>
              <p className="mt-1 text-xs text-slate-500">Booked inventory value</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active Campaigns</p>
              <p className="mt-2 text-2xl font-bold">{kpi.active}</p>
              <p className="mt-1 text-xs text-slate-500">{campaigns.length} total campaigns</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Live Bookings</p>
              <p className="mt-2 text-2xl font-bold">{kpi.live}</p>
              <p className="mt-1 text-xs text-slate-500">{bookings.length} booking records</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Occupancy</p>
              <p className="mt-2 text-2xl font-bold">{kpi.occ}%</p>
              <p className="mt-1 text-xs text-slate-500">Network utilization</p>
            </article>
          </section>

          <section
            id="analytics"
            className={`${activeSection === 'analytics' ? 'grid' : 'hidden'} gap-4 xl:grid-cols-2`}>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Revenue by Channel</h2>
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={channels.map((ch) => ({channel: ch, value: rows.filter((r) => r.loc?.channel === ch).reduce((s, r) => s + r.spot_count * r.unit_price, 0)}))}>
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="channel" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                    <Tooltip formatter={(v: number) => money(v)} />
                    <Area type="monotone" dataKey="value" stroke="#0284c7" fill="url(#fillRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Top Traffic</h2>
                <Database className="h-4 w-4 text-slate-400" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...locations].sort((a, b) => b.weekly_traffic - a.weekly_traffic).slice(0, 6).map((l) => ({code: l.code, traffic: l.weekly_traffic}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="code" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: number) => num(v)} />
                    <Bar dataKey="traffic" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section
            id="locations"
            className={`${activeSection === 'locations' ? 'grid' : 'hidden'} gap-5 xl:grid-cols-[2fr_1fr]`}>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-blue-600" /> Placement Network</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[880px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Region</th><th className="px-4 py-3">Traffic</th><th className="px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locations.filter((x) => [x.code, x.name, x.region].join(' ').toLowerCase().includes(q.toLowerCase())).map((x) => (
                      <tr key={x.id} className="hover:bg-blue-50/40">
                        <td className="px-4 py-3 font-semibold text-blue-600">{x.code}</td>
                        <td className="px-4 py-3"><p className="font-semibold">{x.name}</p><p className="text-xs text-slate-500">{x.device_type}</p></td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${getChannelStyle(x.channel)}`}>{x.channel}</span>
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" /> {x.operating_hours}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{x.region}</td>
                        <td className="px-4 py-3 font-semibold">{num(x.weekly_traffic)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={x.status}
                            onChange={(e) => void updateLocationStatus(x.id, e.target.value as LocationStatus)}
                            disabled={busy === `loc-${x.id}`}
                            className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold">
                            {locationStatuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">
                Screen Inventory (Type Per Location)
              </h3>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  {selectedLocation
                    ? `Viewing detail: ${selectedLocation.code} - ${selectedLocation.name}`
                    : 'Viewing all locations'}
                </p>
                <select
                  value={screenLocationFilter}
                  onChange={(e) => setScreenLocationFilter(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">
                  <option value="all">All locations</option>
                  {locations.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.code} - {x.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1080px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Screen</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Slots</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {screenRows.map((s) => {
                      const isEditing = editScreenId === s.id;
                      const rowBusy =
                        busy === `screen-${s.id}` ||
                        busy === `screen-edit-${s.id}` ||
                        busy === `screen-del-${s.id}`;
                      return (
                        <tr key={s.id} className="hover:bg-cyan-50/40">
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={sef.location_id}
                                onChange={(e) => setSef((p) => ({...p, location_id: e.target.value}))}
                                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs">
                                {locations.map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.code} - {x.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-800">{s.location?.name ?? 'Unknown location'}</p>
                                <p className="text-xs text-slate-500">{s.location?.code ?? 'N/A'}</p>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                value={sef.screen_code}
                                onChange={(e) => setSef((p) => ({...p, screen_code: e.target.value}))}
                                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs font-semibold text-blue-700"
                              />
                            ) : (
                              <p className="font-semibold text-blue-600">{s.screen_code}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                value={sef.screen_type}
                                onChange={(e) => setSef((p) => ({...p, screen_type: e.target.value}))}
                                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs"
                              />
                            ) : (
                              <span className="inline-flex rounded-lg border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                                {s.screen_type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                value={sef.model}
                                onChange={(e) => setSef((p) => ({...p, model: e.target.value}))}
                                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs"
                              />
                            ) : (
                              <p className="text-slate-600">{s.model}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={sef.slot_count}
                                onChange={(e) => setSef((p) => ({...p, slot_count: e.target.value}))}
                                className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-xs"
                              />
                            ) : (
                              <p className="font-semibold text-slate-700">{num(s.slot_count)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={sef.status}
                                onChange={(e) => setSef((p) => ({...p, status: e.target.value as ScreenStatus}))}
                                className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold">
                                {screenStatuses.map((x) => (
                                  <option key={x} value={x}>
                                    {x}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={s.status}
                                onChange={(e) => void updateScreenStatus(s.id, e.target.value as ScreenStatus)}
                                disabled={busy === `screen-${s.id}`}
                                className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold">
                                {screenStatuses.map((x) => (
                                  <option key={x} value={x}>
                                    {x}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void updateScreen(s.id)}
                                    disabled={rowBusy}
                                    className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 disabled:opacity-60">
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditScreen}
                                    disabled={rowBusy}
                                    className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 disabled:opacity-60">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => beginEditScreen(s)}
                                    disabled={busy !== null}
                                    className="inline-flex h-8 items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 disabled:opacity-60">
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void removeScreen(s.id)}
                                    disabled={rowBusy}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 disabled:opacity-60">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {screenRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                          No screens found for this location filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Add Location</h3>
              <form onSubmit={(e) => void addLocation(e)} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannelMode('existing')}
                    className={`h-9 rounded-xl border text-xs font-semibold ${
                      channelMode === 'existing'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}>
                    Use existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelMode('new')}
                    className={`h-9 rounded-xl border text-xs font-semibold ${
                      channelMode === 'new'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}>
                    New channel
                  </button>
                </div>
                <input value={lf.code} onChange={(e) => setLf((p) => ({...p, code: e.target.value}))} placeholder="Code" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                <input value={lf.name} onChange={(e) => setLf((p) => ({...p, name: e.target.value}))} placeholder="Location name" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                {channelMode === 'existing' ? (
                  <select value={lf.channel} onChange={(e) => setLf((p) => ({...p, channel: e.target.value as ChannelType}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm">
                    {channels.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                ) : (
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value)}
                      placeholder="New channel name"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={createChannelOption}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      Create
                    </button>
                  </div>
                )}
                <input value={lf.region} onChange={(e) => setLf((p) => ({...p, region: e.target.value}))} placeholder="Region" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                <button disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Plus className="h-4 w-4" /> Create location</button>
              </form>

              <hr className="my-5 border-slate-200" />

              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Add Screen Type For Location
              </h3>
              <form onSubmit={(e) => void addScreen(e)} className="space-y-3">
                <select
                  value={sf.location_id}
                  onChange={(e) => setSf((p) => ({...p, location_id: e.target.value}))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm">
                  {locations.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.code} - {x.name}
                    </option>
                  ))}
                </select>
                <input
                  value={sf.screen_code}
                  onChange={(e) => setSf((p) => ({...p, screen_code: e.target.value}))}
                  placeholder="Screen code (VD: DP1, LCD2)"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                <input
                  value={sf.screen_type}
                  onChange={(e) => setSf((p) => ({...p, screen_type: e.target.value}))}
                  placeholder="Screen type (VD: DP, LCD, LED)"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                <input
                  value={sf.model}
                  onChange={(e) => setSf((p) => ({...p, model: e.target.value}))}
                  placeholder='Model (VD: 21.5" logo)'
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={sf.slot_count}
                    onChange={(e) => setSf((p) => ({...p, slot_count: e.target.value}))}
                    placeholder="Slot count"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                  <select
                    value={sf.status}
                    onChange={(e) => setSf((p) => ({...p, status: e.target.value as ScreenStatus}))}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm">
                    {screenStatuses.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={saving}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
                  <Plus className="h-4 w-4" /> Create screen
                </button>
              </form>
            </article>
          </section>

          <section
            id="campaigns"
            className={`${activeSection === 'campaigns' ? 'grid' : 'hidden'} gap-5 xl:grid-cols-[2fr_1fr]`}>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-purple-600" /> Campaign Manager</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Advertiser</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.filter((x) => [x.name, x.advertiser].join(' ').toLowerCase().includes(q.toLowerCase())).map((x) => (
                      <tr key={x.id} className="hover:bg-blue-50/40">
                        <td className="px-4 py-3"><p className="font-semibold">{x.name}</p><p className="text-xs text-slate-500">{x.objective}</p></td>
                        <td className="px-4 py-3">{x.advertiser}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(x.start_date)} - {formatDate(x.end_date)}</td>
                        <td className="px-4 py-3 font-semibold">{money(x.budget)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${campaignStyle[x.status]}`}>{x.status}</span>
                            <select
                              value={x.status}
                              onChange={(e) => void updateCampaignStatus(x.id, e.target.value as CampaignStatus)}
                              disabled={busy === `cam-${x.id}`}
                              className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold">
                              {campaignStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Add Campaign</h3>
              <form onSubmit={(e) => void addCampaign(e)} className="space-y-3">
                <input value={cf.name} onChange={(e) => setCf((p) => ({...p, name: e.target.value}))} placeholder="Campaign name" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                <input value={cf.advertiser} onChange={(e) => setCf((p) => ({...p, advertiser: e.target.value}))} placeholder="Advertiser" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                <input type="number" value={cf.budget} onChange={(e) => setCf((p) => ({...p, budget: e.target.value}))} placeholder="Budget" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={cf.start_date} onChange={(e) => setCf((p) => ({...p, start_date: e.target.value}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                  <input type="date" value={cf.end_date} onChange={(e) => setCf((p) => ({...p, end_date: e.target.value}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                </div>
                <button disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Plus className="h-4 w-4" /> Create campaign</button>
              </form>
            </article>
          </section>

          <section
            id="bookings"
            className={`${activeSection === 'bookings' ? 'grid' : 'hidden'} gap-5 xl:grid-cols-[2fr_1fr]`}>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold"><CalendarClock className="h-5 w-5 text-cyan-600" /> Booking Desk</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-4 py-3">Placement</th><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Window</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((x) => (
                      <tr key={x.id} className="hover:bg-blue-50/40">
                        <td className="px-4 py-3"><p className="font-semibold">{x.loc?.name ?? 'Unknown'}</p><p className="text-xs text-slate-500">{x.loc?.code ?? 'N/A'}</p></td>
                        <td className="px-4 py-3"><p className="font-semibold">{x.cam?.name ?? 'Unknown'}</p><p className="text-xs text-slate-500">{x.cam?.advertiser ?? 'N/A'}</p></td>
                        <td className="px-4 py-3 text-slate-600"><p>{formatDateTime(x.start_at)}</p><p>{formatDateTime(x.end_at)}</p></td>
                        <td className="px-4 py-3 font-semibold">{money(x.spot_count * x.unit_price)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${bookingStyle[x.status]}`}>{x.status}</span>
                            <select
                              value={x.status}
                              onChange={(e) => void updateBookingStatus(x.id, e.target.value as BookingStatus)}
                              disabled={busy === `book-${x.id}`}
                              className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold">
                              {bookingStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3"><button onClick={() => void removeBooking(x.id)} disabled={busy === `del-${x.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Create Booking</h3>
              <form onSubmit={(e) => void addBooking(e)} className="space-y-3">
                <select value={bf.location_id} onChange={(e) => setBf((p) => ({...p, location_id: e.target.value}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm">
                  {locations.map((x) => <option key={x.id} value={x.id}>{x.code} - {x.name}</option>)}
                </select>
                <select value={bf.campaign_id} onChange={(e) => setBf((p) => ({...p, campaign_id: e.target.value}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm">
                  {campaigns.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="datetime-local" value={bf.start_at} onChange={(e) => setBf((p) => ({...p, start_at: e.target.value}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                  <input type="datetime-local" value={bf.end_at} onChange={(e) => setBf((p) => ({...p, end_at: e.target.value}))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={bf.spot_count} onChange={(e) => setBf((p) => ({...p, spot_count: e.target.value}))} placeholder="Spot count" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                  <input type="number" value={bf.unit_price} onChange={(e) => setBf((p) => ({...p, unit_price: e.target.value}))} placeholder="Unit price" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                </div>
                <button disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Plus className="h-4 w-4" /> Create booking</button>
              </form>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

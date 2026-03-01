import React, { useState, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  MapPin, 
  MonitorPlay, 
  BarChart3, 
  Settings, 
  Bell, 
  Search, 
  Plus,
  Filter,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  TrendingUp,
  Users,
  Monitor,
  Activity,
  Save,
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  Store,
  Clock
} from 'lucide-react';

// --- INITIAL MOCK DATA ---
const initialLocations = [
  // Kênh University
  { id: 'L1', name: 'ĐH Tôn Đức Thắng', code: 'TANBD', city: 'HCM', channel: 'University', device: 'DP', model: '21.5"', traffic: 20000, region: 'Khu Nam' },
  { id: 'L2', name: 'ĐH Bách Khoa Hà Nội', code: 'HN01', city: 'HN', channel: 'University', device: 'DP', model: '21.5"', traffic: 25000, region: 'Hai Bà Trưng' },
  { id: 'L3', name: 'CĐ FPT Polytechnic', code: 'CT01', city: 'Cần Thơ', channel: 'University', device: 'LCD', model: '50"', traffic: 5000, region: 'Cái Răng' },
  // Kênh Cafe
  { id: 'L4', name: 'Highlands Coffee Landmark', code: 'HCM-CF01', city: 'HCM', channel: 'Cafe', device: 'LCD', model: '43"', traffic: 12000, region: 'Bình Thạnh' },
  { id: 'L5', name: 'The Coffee House Cầu Giấy', code: 'HN-CF01', city: 'HN', channel: 'Cafe', device: 'DP', model: '21.5"', traffic: 8000, region: 'Cầu Giấy' },
  // Kênh Fast Food
  { id: 'L6', name: 'KFC Nguyễn Thái Học', code: 'HCM-FF01', city: 'HCM', channel: 'Fast Food', device: 'LCD', model: '50"', traffic: 15000, region: 'Quận 1' },
  { id: 'L7', name: 'Lotteria Trần Duy Hưng', code: 'HN-FF01', city: 'HN', channel: 'Fast Food', device: 'DP', model: '21.5"', traffic: 18000, region: 'Cầu Giấy' },
  // Kênh Salon
  { id: 'L8', name: '30Shine CMT8', code: 'HCM-SL01', city: 'HCM', channel: 'Salon', device: 'DP', model: '21.5"', traffic: 6000, region: 'Quận 3' },
];

const campaignsData = [
  { id: 'C1', client: 'Garnier Mochi', package: 'X4', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'C2', client: 'Rohto Mineral Tear', package: 'Standard', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'C3', client: 'WPP_Grab AWO', package: 'Premium', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { id: 'C4', client: 'Kính mắt Việt Tín', package: 'X2', color: 'bg-orange-100 text-orange-700 border-orange-300' },
];

const initialSchedules = {
  'L1': { 'W08': { status: 'maintenance', text: 'BẢO TRÌ' }, 'W09': { type: 'campaign', campaignId: 'C1' }, 'W10': { type: 'campaign', campaignId: 'C1' } },
  'L2': { 'W08': { type: 'campaign', campaignId: 'C3' }, 'W09': { type: 'campaign', campaignId: 'C3' }, 'W10': { type: 'campaign', campaignId: 'C2' } },
  'L3': { 'W08': { status: 'holiday', text: 'TRƯỜNG NGHỈ TẾT' }, 'W09': { status: 'holiday', text: 'TRƯỜNG NGHỈ TẾT' } },
  'L4': { 'W08': { type: 'campaign', campaignId: 'C2' }, 'W09': { type: 'campaign', campaignId: 'C2' } },
  'L5': { 'W10': { type: 'campaign', campaignId: 'C4' } },
  'L6': { 'W08': { type: 'campaign', campaignId: 'C3' }, 'W09': { type: 'campaign', campaignId: 'C1' } },
};

// Cấu hình Kênh và Giờ hoạt động mặc định
const initialChannelsSettings = [
  { id: 'ch1', name: 'University', startTime: '06:00', endTime: '18:00' },
  { id: 'ch2', name: 'Cafe', startTime: '07:00', endTime: '22:00' },
  { id: 'ch3', name: 'Fast Food', startTime: '08:00', endTime: '23:00' },
  { id: 'ch4', name: 'Salon', startTime: '08:30', endTime: '21:00' },
  { id: 'ch5', name: 'Gym', startTime: '05:00', endTime: '22:00' },
  { id: 'ch6', name: 'Supermarket', startTime: '08:00', endTime: '22:00' },
];

const weeks = ['W08', 'W09', 'W10', 'W11'];
const cities = ['All', 'HCM', 'HN', 'Cần Thơ', 'Đà Nẵng'];

// Helper màu sắc cho từng Kênh
const getChannelColor = (channel: string) => {
  switch(channel) {
    case 'University': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'Cafe': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Fast Food': return 'bg-red-100 text-red-700 border-red-200';
    case 'Salon': return 'bg-pink-100 text-pink-700 border-pink-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('booking');
  const [locations, setLocations] = useState(initialLocations);
  const [campaigns, setCampaigns] = useState(campaignsData);
  const [schedules, setSchedules] = useState<any>(initialSchedules);
  const [channels, setChannels] = useState(initialChannelsSettings); // Quản lý Kênh & Giờ hoạt động
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');
  
  // Modals & Notifications
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, locationId: string | null, week: string | null}>({ isOpen: false, locationId: null, week: null });
  const [detailsModal, setDetailsModal] = useState<{isOpen: boolean, locationId: string | null, week: string | null, data: any}>({ isOpen: false, locationId: null, week: null, data: null });
  const [isAddLocModalOpen, setIsAddLocModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Upload State
  const [uploadState, setUploadState] = useState<{file: File | null, progress: number, status: string}>({ file: null, progress: 0, status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tạo danh sách Kênh thả xuống (Dropdown)
  const channelsList = ['All', ...channels.map(c => c.name)];

  // --- LOGIC: Filter Data ---
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchCity = selectedCity === 'All' || loc.city === selectedCity;
      const matchChannel = selectedChannel === 'All' || loc.channel === selectedChannel;
      const matchSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          loc.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchChannel && matchSearch;
    });
  }, [locations, searchQuery, selectedCity, selectedChannel]);

  // --- LOGIC: Dashboard Stats ---
  const stats = useMemo(() => {
    let totalSlots = locations.length * weeks.length;
    let bookedSlots = 0;
    let unavailableSlots = 0;
    
    locations.forEach(loc => {
      weeks.forEach(week => {
        const cell = schedules[loc.id]?.[week];
        if (cell?.type === 'campaign') bookedSlots++;
        if (cell?.status) unavailableSlots++;
      });
    });

    const activeSlots = totalSlots - unavailableSlots;
    const occupancyRate = activeSlots > 0 ? Math.round((bookedSlots / activeSlots) * 100) : 0;

    return { totalSlots, bookedSlots, unavailableSlots, occupancyRate };
  }, [locations, schedules]);

  // --- HANDLERS ---
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCellClick = (locationId: string, week: string, cellData: any) => {
    if (cellData?.status) return;
    
    if (cellData?.type === 'campaign') {
      const camp = campaigns.find(c => c.id === cellData.campaignId);
      setDetailsModal({ isOpen: true, locationId, week, data: camp });
    } else {
      setModalConfig({ isOpen: true, locationId, week });
    }
  };

  const handleCreateBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const campaignId = formData.get('campaignId') as string;
    const locId = modalConfig.locationId || (formData.get('locationId') as string);
    const selectedWeeks = modalConfig.week ? [modalConfig.week] : weeks.filter(w => formData.get(`week_${w}`));

    if (!campaignId || !locId || selectedWeeks.length === 0) {
      alert('Vui lòng điền đủ thông tin');
      return;
    }

    const newSchedules = { ...schedules };
    if (!newSchedules[locId]) newSchedules[locId] = {};
    
    selectedWeeks.forEach(w => {
      newSchedules[locId][w] = { type: 'campaign', campaignId };
    });

    setSchedules(newSchedules);
    setModalConfig({ isOpen: false, locationId: null, week: null });
    showToast('Tạo booking thành công!');
  };

  const handleDeleteBooking = () => {
    const { locationId, week } = detailsModal;
    if (!locationId || !week) return;
    const newSchedules = { ...schedules };
    delete newSchedules[locationId][week];
    setSchedules(newSchedules);
    setDetailsModal({ isOpen: false, locationId: null, week: null, data: null });
    showToast('Đã gỡ booking thành công!');
  };

  const handleAddLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newLocation = {
      id: `L${Date.now()}`,
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      city: formData.get('city') as string,
      region: formData.get('region') as string,
      channel: formData.get('channel') as string,
      device: formData.get('device') as string,
      model: formData.get('model') as string,
      traffic: parseInt((formData.get('traffic') as string) || '0', 10),
    };

    setLocations([...locations, newLocation]);
    setIsAddLocModalOpen(false);
    showToast(`Đã thêm điểm ${newLocation.name} thuộc kênh ${newLocation.channel} thành công!`);
  };

  // Logic lưu Cài đặt (Settings)
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updatedChannels = channels.map(ch => ({
      ...ch,
      startTime: formData.get(`start_${ch.id}`) as string,
      endTime: formData.get(`end_${ch.id}`) as string,
    }));
    
    setChannels(updatedChannels);
    showToast('Đã cập nhật Giờ hoạt động của Kênh thành công!');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadState({ file, progress: 0, status: 'selected' });
    }
  };

  const handleProcessImport = () => {
    if (!uploadState.file) return;
    setUploadState(prev => ({ ...prev, status: 'uploading' }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress > 100) progress = 100;
      setUploadState(prev => ({ ...prev, progress }));
      
      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          const newCampId = `C_${Date.now()}`;
          const newCampaign = { 
            id: newCampId, 
            client: 'ShopeeFood (Imported)', 
            package: 'Standard', 
            color: 'bg-red-100 text-red-700 border-red-300' 
          };
          
          setCampaigns(prev => [...prev, newCampaign]);

          const newSchedules = { ...schedules };
          locations.slice(0, 4).forEach(loc => { 
            if (!newSchedules[loc.id]) newSchedules[loc.id] = {};
            if (!newSchedules[loc.id]['W11']) {
              newSchedules[loc.id]['W11'] = { type: 'campaign', campaignId: newCampId };
            }
          });
          
          setSchedules(newSchedules);
          
          setUploadState({ file: null, progress: 0, status: 'idle' });
          setIsUploadModalOpen(false);
          showToast(`Đã import dữ liệu thành công! Phân bổ tự động vào các Kênh.`);
        }, 500);
      }
    }, 300);
  };


  // --- RENDER COMPONENTS ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <MonitorPlay className="text-blue-500" size={28} />
          <h1 className="text-xl font-bold text-white tracking-tight">OOH<span className="text-blue-500">Master</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<CalendarDays />} label="Lịch Booking (Grid)" isActive={activeTab === 'booking'} onClick={() => setActiveTab('booking')} />
          <NavItem icon={<MapPin />} label="Quản lý Điểm đặt" isActive={activeTab === 'locations'} onClick={() => setActiveTab('locations')} />
          <NavItem icon={<BarChart3 />} label="Báo cáo Campaign" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <NavItem icon={<Settings />} label="Cài đặt hệ thống" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-slate-100 px-4 py-2 rounded-lg w-96 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 ring-blue-100 transition-all">
            <Search className="text-slate-400 mr-2" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm điểm đặt (vd: Tôn Đức Thắng, FF01)..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                AD
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Admin User</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Operation Dept</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50/50">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Tổng quan Hệ thống</h2>
                <p className="text-sm text-slate-500 mt-1">Số liệu real-time theo kênh và chiến dịch hiện tại</p>
              </div>
              
              <div className="grid grid-cols-4 gap-6">
                <StatCard icon={<Monitor className="text-blue-600"/>} label="Tổng số Màn hình" value={locations.length} bg="bg-blue-50" />
                <StatCard icon={<Activity className="text-emerald-600"/>} label="Lượt Traffic / Tuần" value={(locations.reduce((acc, loc) => acc + loc.traffic, 0) / 1000).toFixed(1) + 'K'} bg="bg-emerald-50" />
                <StatCard icon={<CalendarDays className="text-purple-600"/>} label="Slot đã Booking" value={stats.bookedSlots} sub={`${stats.totalSlots} tổng slot`} bg="bg-purple-50" />
                <StatCard icon={<TrendingUp className="text-orange-600"/>} label="Tỷ lệ Lấp đầy" value={`${stats.occupancyRate}%`} bg="bg-orange-50" />
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8">
                {/* Campaigns List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18}/> Top Chiến dịch Đang chạy ({campaigns.length})</h3>
                  <div className="space-y-3">
                    {campaigns.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <p className="font-semibold text-sm">{c.client}</p>
                          <p className="text-xs text-slate-500">Gói: {c.package}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${c.color}`}>Active</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phân bổ theo Kênh */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store size={18}/> Điểm đặt theo Kênh (Channel)</h3>
                  <div className="space-y-4 mt-6">
                    {channels.map(ch => {
                      const count = locations.filter(l => l.channel === ch.name).length;
                      if (count === 0) return null;
                      const percentage = Math.round((count / locations.length) * 100);
                      return (
                        <div key={ch.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{ch.name}</span>
                            <span className="text-slate-500">{count} điểm ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${ch.name === 'University' ? 'bg-indigo-500' : ch.name === 'Cafe' ? 'bg-amber-500' : ch.name === 'Fast Food' ? 'bg-red-500' : 'bg-pink-500'}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BOOKING MATRIX */}
          {activeTab === 'booking' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">Matrix Booking - Đa Kênh</h2>
                  <p className="text-sm text-slate-500">Bấm vào ô trống để đặt lịch, bấm vào màu để gỡ lịch.</p>
                </div>
                <div className="flex gap-3">
                  {/* Lọc theo Kênh */}
                  <select 
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium shadow-sm outline-none cursor-pointer text-slate-700"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                  >
                    {channelsList.map(ch => <option key={ch} value={ch}>{ch === 'All' ? 'Tất cả các Kênh' : `Kênh: ${ch}`}</option>)}
                  </select>

                  {/* Lọc theo Khu vực */}
                  <select 
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium shadow-sm outline-none cursor-pointer text-slate-700"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    {cities.map(city => <option key={city} value={city}>{city === 'All' ? 'Toàn quốc' : `Khu vực: ${city}`}</option>)}
                  </select>
                  
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-all">
                    <UploadCloud size={16} className="text-slate-500" /> Import
                  </button>

                  <button 
                    onClick={() => setModalConfig({ isOpen: true, locationId: null, week: null })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-all">
                    <Plus size={16} /> Đặt lịch nhanh
                  </button>
                </div>
              </div>

              {/* Matrix Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                  <div className="col-span-4 p-4 border-r border-slate-200">
                    Thông tin Điểm đặt (Location)
                  </div>
                  {weeks.map(week => (
                    <div key={week} className="col-span-2 p-4 text-center border-r border-slate-200 last:border-0">
                      <span className="text-slate-800 font-bold block">{week}</span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">2026</span>
                    </div>
                  ))}
                </div>

                <div className="overflow-y-auto flex-1">
                  {filteredLocations.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">Không tìm thấy điểm đặt phù hợp với bộ lọc hiện tại.</div>
                  ) : filteredLocations.map((loc) => {
                    // Lấy giờ hoạt động của Kênh
                    const locChannelConfig = channels.find(c => c.name === loc.channel);
                    const operatingHours = locChannelConfig ? `${locChannelConfig.startTime} - ${locChannelConfig.endTime}` : '--';

                    return (
                      <div key={loc.id} className="grid grid-cols-12 border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                        <div className="col-span-4 p-4 border-r border-slate-100 flex flex-col justify-center">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-800 truncate" title={loc.name}>{loc.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                            <span className={`px-1.5 py-0.5 rounded font-medium border ${getChannelColor(loc.channel)}`}>{loc.channel}</span>
                            <span className="flex items-center gap-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              <Clock size={10} /> {operatingHours}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">{loc.code}</span>
                          </div>
                        </div>

                        {weeks.map(week => {
                          const cellData = schedules[loc.id]?.[week];
                          return (
                            <div 
                              key={`${loc.id}-${week}`} 
                              onClick={() => handleCellClick(loc.id, week, cellData)}
                              className={`col-span-2 p-2 border-r border-slate-100 last:border-0 relative group/cell transition-all
                                ${!cellData ? 'cursor-pointer hover:bg-blue-50/50' : ''}
                                ${cellData?.status ? 'bg-slate-50 cursor-not-allowed' : ''}
                                ${cellData?.type === 'campaign' ? 'cursor-pointer' : ''}
                              `}
                            >
                              {cellData ? (
                                cellData.type === 'campaign' ? (
                                  (() => {
                                    const camp = campaigns.find(c => c.id === cellData.campaignId);
                                    return (
                                      <div className={`h-full w-full rounded-md border p-2 flex flex-col justify-center shadow-sm hover:shadow-md hover:scale-[1.02] ${camp?.color || 'bg-gray-100'} transition-all`}>
                                        <p className="text-xs font-bold truncate" title={camp?.client}>{camp?.client}</p>
                                        <p className="text-[10px] opacity-80 mt-0.5 font-medium">{camp?.package}</p>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="h-full w-full bg-slate-100 border border-slate-200 rounded-md p-2 flex flex-col justify-center items-center text-slate-500">
                                    <AlertCircle size={14} className="mb-1 opacity-40" />
                                    <p className="text-[10px] font-medium text-center leading-tight truncate w-full" title={cellData.text}>{cellData.text}</p>
                                  </div>
                                )
                              ) : (
                                <div className="h-full w-full border border-dashed border-slate-200 rounded-md flex items-center justify-center opacity-0 group-hover/cell:opacity-100 group-hover/cell:border-blue-400">
                                  <Plus size={16} className="text-blue-500" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOCATIONS LIST */}
          {activeTab === 'locations' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Danh sách Điểm đặt theo Kênh</h2>
                </div>
                <div className="flex gap-3">
                  <select 
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium shadow-sm outline-none cursor-pointer"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                  >
                    {channelsList.map(ch => <option key={ch} value={ch}>{ch === 'All' ? 'Tất cả Kênh' : `Kênh: ${ch}`}</option>)}
                  </select>
                  <button 
                    onClick={() => setIsAddLocModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-white text-sm font-medium hover:bg-slate-900 transition-all shadow-sm">
                    <Plus size={16} /> Thêm điểm mới
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Mã ĐĐ</th>
                      <th className="px-6 py-4 font-semibold">Tên Địa Điểm</th>
                      <th className="px-6 py-4 font-semibold">Kênh (Hoạt động)</th>
                      <th className="px-6 py-4 font-semibold">Khu Vực</th>
                      <th className="px-6 py-4 font-semibold">Thiết Bị</th>
                      <th className="px-6 py-4 font-semibold">Traffic (Tuần)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLocations.map(loc => {
                      const locChannelConfig = channels.find(c => c.name === loc.channel);
                      const operatingHours = locChannelConfig ? `${locChannelConfig.startTime} - ${locChannelConfig.endTime}` : '--';

                      return (
                        <tr key={loc.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-blue-600">{loc.code}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{loc.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getChannelColor(loc.channel)}`}>
                              {loc.channel}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                              <Clock size={11} /> {operatingHours}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{loc.city} - {loc.region}</td>
                          <td className="px-6 py-4 text-slate-600">{loc.device} {loc.model}</td>
                          <td className="px-6 py-4 text-slate-600">{loc.traffic.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS (CÀI ĐẶT HỆ THỐNG - QUẢN LÝ GIỜ KÊNH) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Cài đặt Hệ thống</h2>
                <p className="text-sm text-slate-500 mt-1">Cấu hình tham số lõi của hệ thống quảng cáo</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" /> Cấu hình Giờ hoạt động theo Kênh
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Giờ mở cửa/đóng cửa sẽ ảnh hưởng trực tiếp đến tổng số slot hiển thị quảng cáo (Impressions) tính cho khách hàng.</p>
                </div>
                
                <form onSubmit={handleSaveSettings} className="p-6">
                  <div className="space-y-4">
                    {channels.map(ch => (
                      <div key={ch.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 w-1/3">
                          <span className={`px-3 py-1.5 rounded text-sm font-bold border ${getChannelColor(ch.name)}`}>
                            {ch.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 w-2/3 justify-end">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-600">Mở cửa:</label>
                            <input 
                              type="time" 
                              name={`start_${ch.id}`} 
                              defaultValue={ch.startTime}
                              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                            />
                          </div>
                          <span className="text-slate-400">-</span>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-600">Đóng cửa:</label>
                            <input 
                              type="time" 
                              name={`end_${ch.id}`} 
                              defaultValue={ch.endTime}
                              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                      <Save size={18} /> Lưu cấu hình Giờ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* TAB: REPORTS */}
          {activeTab === 'reports' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <BarChart3 size={64} className="mb-4 opacity-20" />
              <h2 className="text-xl font-semibold">Module Báo cáo & Chụp Ảnh Nghiệm thu</h2>
              <p className="text-sm mt-2">Đang kết nối API xử lý hình ảnh thực tế từ thiết bị.</p>
            </div>
          )}

        </main>
      </div>

      {/* --- MODALS & TOASTS --- */}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce z-50">
          <CheckCircle2 size={18} className="text-green-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* MODAL: IMPORT EXCEL / CSV */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[550px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600" size={20} /> Import Bảng Tiến Độ
              </h3>
              <button onClick={() => {
                setIsUploadModalOpen(false);
                setUploadState({ file: null, progress: 0, status: 'idle' });
              }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all text-center
                  ${uploadState.status === 'idle' ? 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer' : 'border-blue-500 bg-blue-50/50'}`}
                onClick={() => uploadState.status === 'idle' && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  onChange={handleFileSelect}
                />
                
                {uploadState.status === 'idle' && (
                  <>
                    <UploadCloud size={48} className="text-slate-400 mb-4" />
                    <p className="font-semibold text-slate-700 mb-1">Kéo thả file vào đây hoặc Nhấp để duyệt</p>
                    <p className="text-xs text-slate-500">Hỗ trợ định dạng: .xlsx, .csv (Mẫu Bảng BCKH, BTĐ Newform)</p>
                  </>
                )}

                {(uploadState.status === 'selected' || uploadState.status === 'uploading') && (
                  <>
                    <FileSpreadsheet size={48} className="text-blue-600 mb-4" />
                    <p className="font-semibold text-slate-800 truncate w-full px-4">{uploadState.file?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{uploadState.file ? (uploadState.file.size / 1024).toFixed(2) : 0} KB</p>
                  </>
                )}
              </div>

              {uploadState.status === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-blue-600"/> Đang phân tích dữ liệu đa kênh...</span>
                    <span>{uploadState.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadState.progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                disabled={uploadState.status === 'uploading'}
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadState({ file: null, progress: 0, status: 'idle' });
                }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              
              <button 
                onClick={handleProcessImport}
                disabled={uploadState.status === 'idle' || uploadState.status === 'uploading'}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploadState.status === 'uploading' ? 'Đang Import...' : 'Bắt đầu Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM ĐỊA ĐIỂM MỚI */}
      {isAddLocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleAddLocation} className="bg-white rounded-2xl shadow-2xl w-[600px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Store className="text-blue-600" size={20} /> Thêm Điểm Đặt Đa Kênh
              </h3>
              <button type="button" onClick={() => setIsAddLocModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã Địa Điểm (Code)</label>
                  <input type="text" name="code" placeholder="VD: HCM-FF02" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên Địa Điểm</label>
                  <input type="text" name="name" placeholder="VD: KFC Nguyễn Huệ" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kênh (Channel)</label>
                  <select name="channel" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {channels.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tỉnh / Thành phố</label>
                  <select name="city" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="HCM">Hồ Chí Minh</option>
                    <option value="HN">Hà Nội</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quận / Huyện</label>
                  <input type="text" name="region" placeholder="VD: Quận 1" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại thiết bị</label>
                  <select name="device" required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="DP">DP (Digital Poster)</option>
                    <option value="LCD">LCD (Màn hình ngang)</option>
                    <option value="LED">Màn hình LED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kích thước</label>
                  <input type="text" name="model" placeholder="VD: 21.5&quot;, 50&quot;" required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Traffic (Lượt/tuần)</label>
                  <input type="number" name="traffic" placeholder="VD: 20000" min="0" required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsAddLocModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Hủy</button>
              <button type="submit" className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2">
                <Save size={16} /> Lưu Điểm Kênh Mới
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: TẠO BOOKING */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleCreateBooking} className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {modalConfig.week ? `Đặt lịch: ${modalConfig.week}` : 'Tạo Booking Hàng Loạt'}
              </h3>
              <button type="button" onClick={() => setModalConfig({ isOpen: false, locationId: null, week: null })} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-5">
              {!modalConfig.locationId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn Điểm đặt</label>
                  <select name="locationId" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">-- Chọn điểm --</option>
                    {locations.map(l => <option key={l.id} value={l.id}>[{l.channel}] {l.name} ({l.code})</option>)}
                  </select>
                </div>
              )}

              {modalConfig.locationId && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100 text-sm flex items-center gap-2">
                  <MapPin size={16}/> <b>Điểm:</b> {locations.find(l=>l.id===modalConfig.locationId)?.name} 
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] border ${getChannelColor(locations.find(l=>l.id===modalConfig.locationId)?.channel || '')}`}>
                    Kênh: {locations.find(l=>l.id===modalConfig.locationId)?.channel}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Khách hàng / Thương hiệu</label>
                <select name="campaignId" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">-- Chọn khách hàng đang Active --</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.client} ({c.package})</option>)}
                </select>
              </div>

              {!modalConfig.week && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn Tuần phát sóng</label>
                  <div className="grid grid-cols-4 gap-2">
                    {weeks.map(w => (
                      <label key={w} className="border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 transition-all">
                        <input type="checkbox" name={`week_${w}`} className="hidden" defaultChecked />
                        <span className="text-sm font-medium text-slate-700">{w}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setModalConfig({ isOpen: false, locationId: null, week: null })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Hủy</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2">
                Xác nhận Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CHI TIẾT BOOKING (CLICK ĐỂ XÓA) */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[400px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className={`px-6 py-6 flex flex-col items-center text-center border-b border-slate-100 ${detailsModal.data?.color || 'bg-gray-100'}`}>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-slate-800">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold">{detailsModal.data?.client}</h3>
              <p className="text-sm font-medium opacity-80">Gói: {detailsModal.data?.package}</p>
            </div>
            
            <div className="p-6 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Tuần chạy:</span> <span className="font-bold text-slate-800">{detailsModal.week}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Kênh đặt:</span> <span className="font-bold text-slate-800">{locations.find(l=>l.id===detailsModal.locationId)?.channel}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Điểm đặt:</span> <span className="font-bold text-slate-800">{locations.find(l=>l.id===detailsModal.locationId)?.name}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between gap-3 bg-slate-50">
              <button onClick={() => setDetailsModal({ isOpen: false, locationId: null, week: null, data: null })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Đóng</button>
              <button onClick={handleDeleteBooking} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors border border-red-200">
                <Trash2 size={16} /> Gỡ Booking này
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, sub, bg }: { icon: React.ReactNode, label: string, value: string | number, sub?: string, bg: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800 flex items-baseline gap-2">
          {value} {sub && <span className="text-xs font-normal text-slate-400">{sub}</span>}
        </p>
      </div>
    </div>
  );
}
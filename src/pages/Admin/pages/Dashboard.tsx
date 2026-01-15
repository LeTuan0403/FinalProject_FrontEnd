import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Calendar, Loader, DollarSign, Users, TrendingUp } from 'lucide-react';
import { tourService } from '../../../services/tourService';
import { bookingService } from '../../../services/bookingService';
import { Tour, Booking } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const Dashboard = () => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resTours, resBookings] = await Promise.all([
                    tourService.getAll(),
                    bookingService.getAll()
                ]);
                setTours(resTours.data);

                // Handle different response structures for bookings
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawBookings: any = resBookings.data;
                const bookingList = Array.isArray(rawBookings) ? rawBookings : (rawBookings.data || []);
                setBookings(bookingList);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 1. Calculate Summary Stats
    const summary = useMemo(() => {
        const activeBookings = bookings.filter(b => b.trangThai === 'Confirmed' || b.trangThai === 'Đã thanh toán' || b.trangThai === 'Completed');
        const revenue = activeBookings.reduce((acc, curr) => acc + Number(curr.tongTienThanhToan || 0), 0);
        const totalGuests = activeBookings.reduce((acc, curr) => acc + Number(curr.soLuongNguoi || 0), 0);
        const avgPrice = activeBookings.length ? revenue / activeBookings.length : 0;

        return {
            totalTours: tours.length,
            pendingTours: tours.filter(t => !t.daDuyet).length,
            revenue,
            totalGuests,
            avgPrice
        };
    }, [bookings, tours]);

    // 2. Top Booked Tours
    const topTours = useMemo(() => {
        const tourCounts: Record<number, number> = {};
        const tourNames: Record<number, string> = {};

        bookings.forEach(b => {
            if (b.tourId) {
                tourCounts[b.tourId] = (tourCounts[b.tourId] || 0) + 1;
                // Try to find name if available in booking, else lookup in tours array
                if (b.tour?.tenTour) {
                    tourNames[b.tourId] = b.tour.tenTour;
                }
            }
        });

        // Fill missing names from tours array if needed
        tours.forEach(t => {
            if (tourCounts[t.tourId] && !tourNames[t.tourId]) {
                tourNames[t.tourId] = t.tenTour;
            }
        });

        return Object.entries(tourCounts)
            .map(([id, count]) => ({
                name: tourNames[Number(id)] || `Tour #${id}`,
                count: count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [bookings, tours]);

    // 3. Monthly Stats
    const monthlyStats = useMemo(() => {
        const stats: Record<string, { bookings: number, revenue: number }> = {};

        bookings.forEach(b => {
            if (!b.ngayDat) { return; }
            const date = new Date(b.ngayDat);
            const key = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!stats[key]) { stats[key] = { bookings: 0, revenue: 0 }; }

            stats[key].bookings += 1;
            if (['Confirmed', 'Đã thanh toán', 'Completed'].includes(b.trangThai)) {
                stats[key].revenue += Number(b.tongTienThanhToan || 0);
            }
        });

        // Sort by date roughly (parsing MM/YYYY)
        return Object.entries(stats)
            .map(([month, data]) => ({
                month,
                ...data
            }))
            .sort((a, b) => {
                const [m1, y1] = a.month.split('/').map(Number);
                const [m2, y2] = b.month.split('/').map(Number);
                return (y1 - y2) || (m1 - m2);
            });
    }, [bookings]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) { return <div className="flex justify-center items-center h-screen text-gray-500 gap-2"><Loader className="animate-spin" /> Đang tải thống kê...</div>; }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <LayoutDashboard /> Dashboard Thống Kê
            </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Doanh Thu</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.revenue.toLocaleString()} ₫</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Khách Hàng</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.totalGuests} người</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Calendar size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Tổng Booking</p>
                        <p className="text-2xl font-bold text-gray-800">{bookings.length} đơn</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Giá TB/Đơn</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.avgPrice.toLocaleString()} ₫</p>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Monthly Trends */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Xu hướng đặt Tour theo tháng</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="bookings" name="Số lượng đơn" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#82ca9d" strokeWidth={3} hide />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Tours */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Top 5 Tour được đặt nhiều nhất</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topTours} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: '#4B5563' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" name="Số lượt đặt" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                                    {topTours.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Chi tiết thống kê tháng</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="p-4 font-semibold">Tháng</th>
                                <th className="p-4 font-semibold text-center">Số lượng đơn</th>
                                <th className="p-4 font-semibold text-right">Doanh thu</th>
                                <th className="p-4 font-semibold text-right">Trung bình/Đơn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyStats.length > 0 ? monthlyStats.map((stat, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{stat.month}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{stat.bookings}</span>
                                    </td>
                                    <td className="p-4 text-right font-medium text-green-600">{stat.revenue.toLocaleString()} ₫</td>
                                    <td className="p-4 text-right text-gray-600">
                                        {(stat.bookings ? Math.round(stat.revenue / stat.bookings) : 0).toLocaleString()} ₫
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Chưa có dữ liệu thống kê</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

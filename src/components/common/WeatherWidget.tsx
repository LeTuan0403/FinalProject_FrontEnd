import React, { useEffect, useState, useMemo } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Calendar, MapPin, Loader, AlertCircle } from 'lucide-react';

interface WeatherWidgetProps {
    locationName: string;
    departureDate?: string | Date;
}

interface WeatherData {
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    precipitationProbability?: number;
    date: string;
    isForecast: boolean; // Merged for cleaner state
}

// Helper: Normalize string for search
const normalizeForSearch = (name: string) => {
    return name.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/đ/g, "d").replace(/Đ/g, "D");
};

// Helper: Map WMO code to Icon & Label
const getWeatherIcon = (code: number) => {
    if (code === 0) {
        return { icon: <Sun className="text-yellow-500 animate-pulse-slow" size={32} />, label: "Nắng đẹp" };
    }
    if (code >= 1 && code <= 3) {
        return { icon: <Cloud className="text-gray-400" size={32} />, label: "Có mây" };
    }
    if (code >= 45 && code <= 48) {
        return { icon: <Wind className="text-blue-300" size={32} />, label: "Sương mù" };
    }
    if (code >= 51 && code <= 67) {
        return { icon: <CloudRain className="text-blue-500" size={32} />, label: "Mưa nhỏ" };
    }
    if (code >= 71 && code <= 77) {
        return { icon: <Droplets className="text-blue-200" size={32} />, label: "Tuyết rơi" };
    }
    if (code >= 80 && code <= 82) {
        return { icon: <CloudRain className="text-blue-700" size={32} />, label: "Mưa rào" };
    }
    if (code >= 95 && code <= 99) {
        return { icon: <CloudRain className="text-purple-500" size={32} />, label: "Dông bão" };
    }
    return { icon: <Sun className="text-yellow-500" size={32} />, label: "Không xác định" };
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ locationName, departureDate }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);

    // Standardize dates
    const targetDateStr = useMemo(() =>
        departureDate ? new Date(departureDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        [departureDate]);

    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate Diff Days
    const diffDays = useMemo(() => {
        const diffTime = new Date(targetDateStr).getTime() - new Date(todayStr).getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [targetDateStr, todayStr]);

    const isWithinRange = diffDays >= 0 && diffDays <= 14;

    useEffect(() => {
        if (!locationName) {
            return;
        }

        let isMounted = true;
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const searchName = normalizeForSearch(locationName);

                // 1. Geocoding
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=vi&format=json`);
                const geoData = await geoRes.json();

                if (!geoData.results?.length) {
                    throw new Error("Location not found");
                }

                const { latitude, longitude } = geoData.results[0];

                // 2. Weather Forecast
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
                );
                const weatherData = await weatherRes.json();

                if (!weatherData.daily) {
                    throw new Error("No weather data");
                }

                // Find index
                const dates = weatherData.daily.time as string[];
                let index = dates.indexOf(targetDateStr);
                let isForecast = true;

                // Fallback to today if not found
                if (index === -1) {
                    index = 0;
                    isForecast = false;
                }

                if (isMounted) {
                    setWeather({
                        tempMax: weatherData.daily.temperature_2m_max[index],
                        tempMin: weatherData.daily.temperature_2m_min[index],
                        weatherCode: weatherData.daily.weather_code[index],
                        precipitationProbability: weatherData.daily.precipitation_probability_max?.[index],
                        date: dates[index],
                        isForecast
                    });
                }
            } catch (err) {
                console.error("Weather fetch error:", err); // Keep console log for debugging
                if (isMounted) {
                    setWeather(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchWeather();
        return () => { isMounted = false; };
    }, [locationName, targetDateStr]);

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 animate-pulse">
                <Loader className="animate-spin text-blue-500" size={20} />
                <span className="text-sm text-blue-600 font-medium">Đang tải dự báo thời tiết...</span>
            </div>
        );
    }

    if (!weather) {
        return null;
    }

    const { icon, label } = getWeatherIcon(weather.weatherCode);

    return (
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            {/* Decorative Background Blob */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-200/50 transition-colors"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-sm uppercase tracking-wide">
                        <MapPin size={14} className="text-blue-600" />
                        {locationName}
                    </div>

                    {/* Date Badge */}
                    <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${weather.isForecast && isWithinRange ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <Calendar size={10} />
                        {weather.isForecast && isWithinRange
                            ? (diffDays === 0 ? 'Hôm nay' : `Dự báo ${new Date(weather.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`)
                            : 'Thời tiết hiện tại'}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {icon}
                        <div>
                            <div className="text-2xl font-black text-gray-800 leading-none">
                                {Math.round(weather.tempMax)}°C
                            </div>
                            <div className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">
                                {label} • Thấp nhất {Math.round(weather.tempMin)}°C
                            </div>
                        </div>
                    </div>

                    {/* Rain Info */}
                    {weather.precipitationProbability !== undefined && weather.precipitationProbability > 0 && (
                        <div className="text-right">
                            <div className="flex flex-col items-center">
                                <Droplets size={16} className="text-blue-500 mb-0.5" />
                                <span className="text-xs font-bold text-blue-700">{weather.precipitationProbability}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Disclaimer for distant dates */}
                {!isWithinRange && departureDate && (
                    <div className="mt-2 text-[10px] text-gray-500 italic flex items-start gap-1 bg-white/50 p-1.5 rounded border border-gray-100">
                        <AlertCircle size={10} className="mt-0.5 shrink-0" />
                        Ngày khởi hành còn xa, đây là thời tiết hiện tại để tham khảo mùa này.
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherWidget;

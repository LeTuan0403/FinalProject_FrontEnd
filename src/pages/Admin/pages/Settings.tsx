import Sidebar from '../components/Sidebar';

const Settings = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-64 overflow-auto p-8">
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-gray-800">Cài đặt hệ thống</h1>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <p className="text-gray-500">Chức năng đang được phát triển...</p>

                        <div className="mt-6 space-y-4 max-w-lg">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">Chế độ bảo trì</span>
                                <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                                    <div className="w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200 absolute left-0"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

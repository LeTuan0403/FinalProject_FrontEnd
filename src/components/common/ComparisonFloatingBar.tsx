import React from 'react';
import { useComparison } from '../../context/ComparisonContext';
import { useNavigate } from 'react-router-dom';
import { Scale, X, ArrowRight } from 'lucide-react';

const ComparisonFloatingBar: React.FC = () => {
    const { selectedTourIds, clearCompare } = useComparison();
    const navigate = useNavigate();

    if (selectedTourIds.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-teal-100 flex items-center justify-between p-4 backdrop-blur-lg bg-white/95">
                <div className="flex items-center gap-4">
                    <div className="bg-teal-100 p-2 rounded-full">
                        <Scale className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-800">So sánh Tour</p>
                        <p className="text-sm text-gray-500">Đã chọn {selectedTourIds.length} tour</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={clearCompare}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa tất cả"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => navigate('/compare')}
                        className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 flex items-center gap-2"
                    >
                        So sánh ngay <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonFloatingBar;

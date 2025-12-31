import { useState } from 'react';
import { Phone, Facebook, MessageSquare } from 'lucide-react';

const FloatingContact = () => {
    const [isOpen, setIsOpen] = useState(false);

    const contactOptions = [
        {
            label: 'Zalo',
            icon: <span className="font-bold text-xs">Zalo</span>, // Or use a custom SVG/Image if available. Text is fine for now or Lucide MessageCircle
            color: 'bg-blue-600',
            href: 'https://zalo.me/0967087527', // Placeholder
            delay: 'delay-100' // Animation delay
        },
        {
            label: 'Facebook',
            icon: <Facebook size={20} />,
            color: 'bg-blue-800',
            href: 'https://www.facebook.com/le.tuan.10681/', // Placeholder
            delay: 'delay-200'
        },
        {
            label: 'Hotline',
            icon: <Phone size={20} />,
            color: 'bg-red-500',
            href: 'tel:0967087527', // Placeholder
            delay: 'delay-300'
        }
    ];

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 group"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Expanded Options */}
            <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                {contactOptions.map((opt, idx) => (
                    <a
                        key={idx}
                        href={opt.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 pr-1 pl-4 py-1.5 rounded-full shadow-lg transform transition-all hover:scale-110 ${opt.delay} ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}
                    >
                        <span className="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded hidden group-hover:block shadow-sm">
                            {opt.label}
                        </span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${opt.color}`}>
                            {opt.icon}
                        </div>
                    </a>
                ))}
            </div>

            {/* Main Trigger Button */}
            <button
                className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MessageSquare size={28} fill="currentColor" className="text-white" />
            </button>
        </div>
    );
};

export default FloatingContact;

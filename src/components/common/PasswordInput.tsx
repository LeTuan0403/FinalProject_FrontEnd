import { useState } from 'react';
import { FieldValues, UseFormRegister, Path, RegisterOptions, FieldError } from 'react-hook-form';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps<T extends FieldValues> {
    icon: LucideIcon;
    register: UseFormRegister<T>;
    name: Path<T>;
    rules?: RegisterOptions<T>;
    placeholder: string;
    error?: FieldError;
}

const PasswordInput = <T extends FieldValues>({ icon: Icon, register, name, rules, placeholder, error }: PasswordInputProps<T>) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative w-full">
            <div className={`absolute left-3 top-2.5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`}>
                <Icon size={18} />
            </div>
            <input
                {...register(name, rules)}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-100'} 
                   rounded-lg px-10 py-2.5 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 text-gray-700`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-teal-600 transition-colors"
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};

export default PasswordInput;

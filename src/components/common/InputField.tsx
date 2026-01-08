import { FieldValues, UseFormRegister, Path, RegisterOptions, FieldError } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps<T extends FieldValues> {
    icon: LucideIcon;
    register: UseFormRegister<T>;
    name: Path<T>;
    rules?: RegisterOptions<T>;
    placeholder: string;
    type?: string;
    error?: FieldError;
}

const InputField = <T extends FieldValues>({ icon: Icon, register, name, rules, placeholder, type = "text", error }: InputFieldProps<T>) => (
    <div className="relative w-full">
        <div className={`absolute left-3 top-2.5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`}>
            <Icon size={18} />
        </div>
        <input
            {...register(name, rules)}
            type={type}
            placeholder={placeholder}
            className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-100'} 
               rounded-lg px-10 py-2.5 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 text-gray-700`}
        />
    </div>
);

export default InputField;

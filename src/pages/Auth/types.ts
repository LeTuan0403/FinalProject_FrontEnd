import { UseFormRegister, RegisterOptions, FieldError } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

export interface InputFieldProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: LucideIcon | any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rules?: RegisterOptions | any;
    placeholder?: string;
    type?: string;
    error?: FieldError;
}

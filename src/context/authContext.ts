import { createContext } from 'react';
import type { AuthContextType } from './AuthContextProvider';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

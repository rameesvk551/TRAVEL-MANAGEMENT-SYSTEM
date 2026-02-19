import { createContext, useContext, useMemo, useReducer, type FC, type ReactNode } from 'react';

export type AdminThemeMode = 'light' | 'dark';

interface AdminUiState {
  sidebarCollapsed: boolean;
  themeMode: AdminThemeMode;
  globalSearch: string;
}

type AdminUiAction =
  | { type: 'toggleSidebar' }
  | { type: 'setThemeMode'; payload: AdminThemeMode }
  | { type: 'setGlobalSearch'; payload: string };

interface AdminUiContextValue extends AdminUiState {
  toggleSidebar: () => void;
  setThemeMode: (mode: AdminThemeMode) => void;
  setGlobalSearch: (value: string) => void;
}

const initialState: AdminUiState = {
  sidebarCollapsed: false,
  themeMode: 'light',
  globalSearch: '',
};

const reducer = (state: AdminUiState, action: AdminUiAction): AdminUiState => {
  switch (action.type) {
    case 'toggleSidebar':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
    case 'setThemeMode':
      return {
        ...state,
        themeMode: action.payload,
      };
    case 'setGlobalSearch':
      return {
        ...state,
        globalSearch: action.payload,
      };
    default:
      return state;
  }
};

const AdminUiContext = createContext<AdminUiContextValue | null>(null);

export const AdminUiStoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<AdminUiContextValue>(
    () => ({
      ...state,
      toggleSidebar: () => dispatch({ type: 'toggleSidebar' }),
      setThemeMode: (mode) => dispatch({ type: 'setThemeMode', payload: mode }),
      setGlobalSearch: (searchValue) => dispatch({ type: 'setGlobalSearch', payload: searchValue }),
    }),
    [state],
  );

  return <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>;
};

export const useAdminUiStore = (): AdminUiContextValue => {
  const context = useContext(AdminUiContext);
  if (!context) {
    throw new Error('useAdminUiStore must be used inside AdminUiStoreProvider');
  }

  return context;
};

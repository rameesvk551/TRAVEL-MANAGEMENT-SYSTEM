import { useState, useEffect } from 'react';

interface ResponsiveState {
    isMobile: boolean;   // < 768px
    isTablet: boolean;   // 768–1024px
    isDesktop: boolean;  // > 1024px
    width: number;
}

export function useResponsive(): ResponsiveState {
    const [state, setState] = useState<ResponsiveState>(() => ({
        isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
        isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth <= 1024 : false,
        isDesktop: typeof window !== 'undefined' ? window.innerWidth > 1024 : true,
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    }));

    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setState({
                isMobile: w < 768,
                isTablet: w >= 768 && w <= 1024,
                isDesktop: w > 1024,
                width: w,
            });
        };

        window.addEventListener('resize', update);
        update();
        return () => window.removeEventListener('resize', update);
    }, []);

    return state;
}

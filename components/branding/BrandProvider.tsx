'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { BrandTheme } from '../../types/branding';
import { DEFAULT_BRAND } from '../../types/branding';
import { applyBrandTheme } from '../../lib/branding';

interface BrandContextType {
  theme: BrandTheme;
  updateTheme: (newTheme: Partial<BrandTheme>) => void;
}

const BrandContext = createContext<BrandContextType>({
  theme: DEFAULT_BRAND,
  updateTheme: () => {},
});

export function BrandProvider({
  initialTheme = DEFAULT_BRAND,
  children,
}: {
  initialTheme?: BrandTheme;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<BrandTheme>(initialTheme);

  useEffect(() => {
    applyBrandTheme(theme);
  }, [theme]);

  const updateTheme = (newTheme: Partial<BrandTheme>) => {
    setTheme(prev => {
      const merged = { ...prev, ...newTheme };
      applyBrandTheme(merged);
      return merged;
    });
  };

  return (
    <BrandContext.Provider value={{ theme, updateTheme }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);

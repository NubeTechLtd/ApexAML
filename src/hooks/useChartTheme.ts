import { useState, useEffect, useMemo } from 'react';

interface ChartConfig {
  gridColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tickColor: string;
  barPrimary: string;
  barSuccess: string;
  areaStroke: string;
}

const lightConfig: ChartConfig = {
  gridColor: 'hsl(214, 20%, 90%)',
  tooltipBg: 'hsl(0, 0%, 100%)',
  tooltipBorder: 'hsl(214, 20%, 90%)',
  tickColor: 'hsl(215, 14%, 46%)',
  barPrimary: 'hsl(217, 55%, 22%)',
  barSuccess: 'hsl(142, 71%, 45%)',
  areaStroke: 'hsl(217, 55%, 22%)',
};

const darkConfig: ChartConfig = {
  gridColor: '#1e293b',
  tooltipBg: '#1e293b',
  tooltipBorder: '#334155',
  tickColor: '#94a3b8',
  barPrimary: '#60a5fa',
  barSuccess: '#4ade80',
  areaStroke: '#60a5fa',
};

function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

export function useChartTheme(): ChartConfig {
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return useMemo(() => (isDark ? darkConfig : lightConfig), [isDark]);
}

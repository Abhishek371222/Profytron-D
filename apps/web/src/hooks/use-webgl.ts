'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if WebGL is supported in the current browser environment.
 */
export function useWebGLSupport() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setIsSupported(support);
    } catch (e) {
      setIsSupported(false);
    }
  }, []);

  return isSupported;
}

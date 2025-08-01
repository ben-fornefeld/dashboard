import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { ThemeRegistration } from 'shiki'

import baseThemeDark from '@shikijs/themes/vitesse-dark'
import baseThemeLight from '@shikijs/themes/vitesse-light'

export const SHIKI_THEME_DARK: ThemeRegistration = {
  ...baseThemeDark,
  bg: 'transparent',
}

export const SHIKI_THEME_LIGHT: ThemeRegistration = {
  ...baseThemeLight,
  bg: 'transparent',
}

export const useShikiTheme = () => {
  const { resolvedTheme } = useTheme()

  return useMemo(() => {
    if (resolvedTheme === 'dark') {
      return SHIKI_THEME_DARK
    }
    return SHIKI_THEME_LIGHT
  }, [resolvedTheme])
}

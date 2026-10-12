import { PREFERENCES_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/stores';
import { feminineColors, masculineColors } from './tokens';

/**
 * Inline JavaScript snippet for web HTML <head> to prevent theme flash (FOUC)
 * prior to React hydration, reading directly from local storage.
 * Synchronizes documentElement data-theme, theme-blue class, and meta theme-color.
 * Uses exact token background values and dynamically inserts meta tag if not yet present in head.
 *
 * NOTE: The theme resolution logic here directly mirrors resolveActiveTheme(gender, themePreference).
 */
export const THEME_ANTI_FLASH_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_STORAGE_KEY)})||'{}');var u=JSON.parse(localStorage.getItem(${JSON.stringify(SESSION_STORAGE_KEY)})||'{}');var pref=p.state&&p.state.themePreference;var g=u.state&&u.state.session&&u.state.session.user&&u.state.session.user.gender;var effectivePref=pref||'auto';var pal=(effectivePref==='blue'||(effectivePref==='auto'&&g==='male'))?'blue':'pink';document.documentElement.setAttribute('data-theme',pal);if(pal==='blue'){document.documentElement.classList.add('theme-blue');}else{document.documentElement.classList.remove('theme-blue');}var bg=pal==='blue'?${JSON.stringify(masculineColors.background)}:${JSON.stringify(feminineColors.background)};var metaTheme=document.querySelector('meta[name="theme-color"]');if(metaTheme){metaTheme.setAttribute('content',bg);}else{var m=document.createElement('meta');m.name='theme-color';m.content=bg;document.head.appendChild(m);}}catch(e){}})();`;

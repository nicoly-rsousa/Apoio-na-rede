import { useEffect, useState } from 'react';
import { Home, Search, MapPin, PlusCircle, SlidersHorizontal, Sun, Moon } from 'lucide-react';
import { browserStorage } from '../../lib/browserStorage';
import { UserPreferencesModal } from '../accessibility/UserPreferencesModal';

interface NavbarProps {
  currentTab: 'explorer' | 'register';
  onSelectTab: (tab: 'explorer' | 'register') => void;
}

export function Navbar({ currentTab, onSelectTab }: NavbarProps) {
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    browserStorage.getItem('apoio_color_theme') === 'light' ? 'light' : 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    browserStorage.setItem('apoio_color_theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#101111');
  }, [theme]);
  const navigate = (target: 'home' | 'search' | 'catalog' | 'register') => {
    onSelectTab(target === 'register' ? 'register' : 'explorer');
    if (target === 'search' || target === 'catalog') {
      window.setTimeout(() => {
        const element = document.getElementById(target === 'search' ? 'main-search-input' : 'results-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.focus({ preventScroll: true });
      }, 100);
    }
  };
  return <>
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="app-header">
      <div className="header-inner">
        <button type="button" onClick={() => navigate('home')} className="brand-logo" aria-label="Apoio na rede - Página inicial">
          <img className="brand-logo-dark" src="/brand/apoio-na-rede-logo-white.png" alt="" />
          <img className="brand-logo-light" src="/brand/apoio-na-rede-logo.png" alt="" />
        </button>
        <nav className="desktop-navigation" aria-label="Navegação principal">
          <button type="button" aria-current={currentTab === 'explorer' ? 'page' : undefined} onClick={() => navigate('home')}><Home size={17} aria-hidden="true" />Explorar</button>
          <button type="button" onClick={() => navigate('catalog')}><MapPin size={17} aria-hidden="true" />Catálogo</button>
          <button type="button" aria-current={currentTab === 'register' ? 'page' : undefined} onClick={() => navigate('register')}><PlusCircle size={17} aria-hidden="true" />Cadastrar Local</button>
        </nav>
        <button
          type="button"
          className="theme-toggle header-preferences"
          onClick={() => setTheme(previous => previous === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
      </div>
    </header>
    <nav className="mobile-navigation" aria-label="Navegação do celular">
      <button type="button" aria-current={currentTab === 'explorer' ? 'page' : undefined} onClick={() => navigate('home')}><Home size={22} aria-hidden="true" /><span>Início</span></button>
      <button type="button" onClick={() => navigate('search')}><Search size={22} aria-hidden="true" /><span>Buscar</span></button>
      <button type="button" onClick={() => navigate('catalog')}><MapPin size={22} aria-hidden="true" /><span>Catálogo</span></button>
      <button type="button" aria-current={currentTab === 'register' ? 'page' : undefined} onClick={() => navigate('register')}><PlusCircle size={22} aria-hidden="true" /><span>Cadastrar</span></button>
      <button type="button" aria-label="Preferências de acessibilidade" onClick={() => setIsPrefModalOpen(true)}><SlidersHorizontal size={22} aria-hidden="true" /><span>Ajustes</span></button>
    </nav>
    <UserPreferencesModal isOpen={isPrefModalOpen} onClose={() => setIsPrefModalOpen(false)} />
  </>;
}

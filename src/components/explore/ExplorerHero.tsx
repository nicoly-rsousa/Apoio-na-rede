import { ArrowUpRight, MapPin, Navigation, Accessibility, Building2, Coffee, Trees } from 'lucide-react';

export function ExplorerHero() {
  return <header className="explorer-hero">
    <div className="hero-copy">
      <p className="hero-location"><MapPin size={14} aria-hidden="true" /> CATAGUASES, MINAS GERAIS</p>
      <h1>Novos lugares.<br /><span>Mais possibilidades.</span></h1>
      <div className="hero-rule" />
      <p>Encontre seu próximo destino.<br />Conheça os recursos de acessibilidade antes de sair.</p>
      <a href="#search-filter-section" className="hero-link">Explore a cidade <ArrowUpRight size={18} aria-hidden="true" /></a>
    </div>
    <div className="hero-art" aria-hidden="true">
      <div className="city-disc">
        <svg viewBox="0 0 420 350" className="city-streets" fill="none">
          <path d="M-20 85L440 205M10 285L430 35M100-30L300 380M330-20L60 380" stroke="#3b3832" strokeWidth="24" />
          <path d="M-20 85L440 205M10 285L430 35M100-30L300 380M330-20L60 380" stroke="#666052" strokeWidth="1" strokeDasharray="5 9" />
          <path d="M105 240L162 205L220 220L287 132" stroke="var(--ds-accent)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 12" />
          <circle cx="105" cy="240" r="10" fill="var(--ds-accent)" stroke="#edfcf9" strokeWidth="4" />
        </svg>
        <span className="city-block block-one" /><span className="city-block block-two" /><span className="city-block block-three" />
        <span className="art-pin pin-coffee"><Coffee size={25} /></span><span className="art-pin pin-tree"><Trees size={25} /></span>
        <span className="art-pin pin-building"><Building2 size={24} /></span><span className="art-pin pin-destination"><Accessibility size={38} /></span>
      </div>
      <div className="hero-art-label"><span><Navigation size={17} /></span><div>Seu próximo destino<strong>Uma cidade para todos.</strong></div></div>
    </div>
  </header>;
}

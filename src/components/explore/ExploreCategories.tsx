import { ArrowRight, Accessibility, MapPin } from 'lucide-react';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import type { EstablishmentCategory } from '../../types';

const iconColors = ['#ff975c', '#6fc6f1', '#dba0ff', '#a5d76e', '#f1c86b', '#62d4c9', '#ffb45f', '#ff96bf', '#b2a7ff'];

export function ExploreCategories({ selected, onSelect }: { selected: EstablishmentCategory | 'todas'; onSelect: (id: EstablishmentCategory | 'todas') => void }) {
  return <>
    <section className="discovery-banner" aria-label="Planeje sua visita">
      <div><span className="banner-kicker">CADA PESSOA, UM CAMINHO</span><h2>Seu lugar na cidade<br />começa aqui.</h2><p>Consulte o acesso. Escolha o destino. Trace sua rota.</p><a href="#results-section">Encontrar um lugar <ArrowRight size={17} aria-hidden="true" /></a></div>
      <div className="banner-art" aria-hidden="true"><span className="banner-orbit" /><Accessibility size={84} strokeWidth={1.3} /><MapPin className="banner-pin" size={34} /></div>
    </section>
    <section className="category-section" aria-labelledby="category-shortcuts-title">
      <div className="section-heading"><div><span className="section-kicker">EXPLORE DO SEU JEITO</span><h2 id="category-shortcuts-title">O que você procura?</h2></div><button type="button" onClick={() => onSelect('todas')}>Ver todas <ArrowRight size={16} aria-hidden="true" /></button></div>
      <div className="category-grid">{Object.entries(MAP_CATEGORIES).map(([id, category], index) => {
        const Icon = category.icon;
        return <button key={id} type="button" aria-pressed={selected === id} onClick={() => onSelect(id as EstablishmentCategory)} className="category-tile">
          <Icon size={29} strokeWidth={1.6} color={iconColors[index]} aria-hidden="true" /><span>{id === 'banheiro_adaptado' ? 'Banheiros' : category.label.replace(' & Clínicas', '').replace(' & Lojas', '').replace('Lazer & Cultura', 'Lazer').replace('Serviço Público', 'Serviços')}</span>
        </button>;
      })}</div>
    </section>
  </>;
}

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { PlacesService } from '../../services/placesService';

interface Props {
  name: string;
  placeId?: string;
  photo?: string;
  authors?: { nome: string; url: string | null }[];
}

export function PlaceExterior({ name, placeId, photo, authors }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [photos, setPhotos] = useState<{ url: string; authors: Props['authors'] }[]>([]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false); setIndex(0);
    setPhotos(photo && attempt === 0 ? [{ url: photo, authors }] : []);
    async function load() {
      try {
        if (photo && attempt === 0) return;
        if (placeId) {
          const details = await PlacesService.photos(placeId);
          if (!cancelled) setPhotos(details);
        }
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [placeId, photo, authors, attempt]);
  const current = photos[index];
  return <div>
    <div className="h-52 bg-slate-100 relative">
      {current ? <img src={current.url} alt={`Foto de ${name}`} className="w-full h-full object-cover" onError={() => { if (photo && attempt === 0 && placeId) setAttempt(1); else { if (index + 1 >= photos.length) setError(true); setIndex(value => value + 1); } }} /> : <div className="h-full flex flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500" role="status"><MapPin aria-hidden="true" /><span>{loading ? 'Buscando imagem do local…' : error ? 'Não foi possível carregar a imagem' : placeId ? 'O Google não disponibilizou fotos deste local.' : 'Este local ainda não tem foto cadastrada.'}</span>{!loading && error && <button type="button" onClick={() => setAttempt(value => value + 1)} className="underline">Tentar novamente</button>}</div>}
    </div>
    {current && <p className="px-5 pt-2 text-xs text-slate-500">Foto do local · fachada não confirmada{current.authors?.map((author, i) => <span key={i}> · {author.url ? <a href={author.url} target="_blank" rel="noopener noreferrer" className="underline">{author.nome}</a> : author.nome}</span>)}</p>}
  </div>;
}

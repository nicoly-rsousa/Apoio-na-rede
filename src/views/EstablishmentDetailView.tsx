import { directionsUrl } from '../utils/directionsUrl';
import { imageFallback } from '../utils/imageFallback';
import React, { useState } from 'react';
import { Establishment, DisabilityType } from '../types';
import { StorageService } from '../services/storageService';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Globe,
  Star,
  Sparkles,
  Share2,
  Flag,
  Send,
  CheckCircle,
} from 'lucide-react';
import { VerifiedBadge } from '../components/establishments/VerifiedBadge';
import { DisabilityBadge, DISABILITY_INFO } from '../components/accessibility/DisabilityBadge';
import { AccessibilityChecklist } from '../components/accessibility/AccessibilityChecklist';
import { AudioReaderButton } from '../components/accessibility/AudioReaderButton';

interface EstablishmentDetailViewProps {
  establishment: Establishment;
  onBack: () => void;
  onRefresh: () => void;
}

export const EstablishmentDetailView: React.FC<EstablishmentDetailViewProps> = ({
  establishment,
  onBack,
  onRefresh,
}) => {
  const { accessibilityPreferences } = useAccessibility();
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<DisabilityType | 'todas'>('todas');

  // Form de Avaliação
  const [newRating, setNewRating] = useState(5);
  const [newDisability, setNewDisability] = useState<DisabilityType>(
    accessibilityPreferences[0] || 'mobilidade'
  );
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const reviews = establishment.reviews || [];
  const criteria = establishment.criteria || [];

  const filteredReviews = reviews.filter((r) =>
    reviewFilter === 'todas' ? true : r.tipo_deficiencia_avaliada === reviewFilter
  );

  const photos =
    establishment.fotos && establishment.fotos.length > 0
      ? establishment.fotos
      : ['/brand/apoio-na-rede-logo.png'];

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await StorageService.addReview({
        establishment_id: establishment.id,
        user_nome: 'Visitante da comunidade',
        tipo_deficiencia_avaliada: newDisability,
        nota: newRating,
        comentario: newComment,
      });

      setNewComment('');
      setReviewSuccessMsg(true);
      setTimeout(() => setReviewSuccessMsg(false), 4000);
      onRefresh();
    } catch (err) {
      console.error('Erro ao adicionar avaliação:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    const motivo = prompt('Por favor, informe o motivo da denúncia desta avaliação:');
    if (motivo) {
      await StorageService.reportReview(reviewId, motivo);
      setActionMessage('Denúncia registrada para revisão.');
      onRefresh();
    }
  };

  const fullTextToRead = `${establishment.nome}. Categoria: ${establishment.categoria}. Endereço: ${establishment.endereco}, ${establishment.cidade}. Descrição: ${establishment.descricao}. Horário de funcionamento: ${establishment.horario_funcionamento || 'Não informado'}.`;

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-slate-800">
      {/* Botão Voltar & Ações de Topo */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Voltar para a lista e mapa de estabelecimentos"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Voltar ao Catálogo</span>
        </button>

        <div className="flex items-center gap-2">
          <AudioReaderButton textToRead={fullTextToRead} label="Ouvir Informações do Local" />
          <button
            type="button"
            onClick={async () => {
              const url = new URL('https://www.google.com/maps/search/');
              url.searchParams.set('api', '1');
              url.searchParams.set('query', `${establishment.latitude},${establishment.longitude}`);
              if (establishment.place_id) url.searchParams.set('query_place_id', establishment.place_id);
              try {
                if (navigator.share) await navigator.share({ title: establishment.nome, text: `Localização de ${establishment.nome}`, url: url.href });
                else if (navigator.clipboard) { await navigator.clipboard.writeText(url.href); setActionMessage('Link da localização copiado. Os recursos cadastrados ficam neste navegador.'); }
                else setActionMessage(`Copie o link da localização: ${url.href}`);
              } catch (error) {
                if ((error as Error).name !== 'AbortError') setActionMessage(`Não foi possível compartilhar. Copie o link da localização: ${url.href}`);
              }
            }}
            className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl transition-colors"
            title="Compartilhar localização"
            aria-label="Compartilhar localização"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {actionMessage && <p role="status" aria-live="polite" className="mb-4 text-sm font-semibold text-blue-800">{actionMessage}</p>}

      {/* Hero: Cabeçalho com Título, Avaliação e Badges */}
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full uppercase tracking-wider border border-blue-200">
              {establishment.categoria.replace('_', ' ')}
            </span>
            <VerifiedBadge
              status={establishment.status}
              verificadoEm={establishment.verificado_em}
              motivoRejeicao={establishment.motivo_rejeicao}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-amber-900 font-black text-sm">
            <Star size={18} className="fill-amber-400 text-amber-500" aria-hidden="true" />
            <span>{establishment.total_avaliacoes > 0 ? establishment.nota_media : 'Sem avaliações'}</span>
            <span className="text-xs text-amber-700 font-semibold">
              ({establishment.total_avaliacoes} {establishment.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
          {establishment.nome}
        </h1>

        <div className="flex items-start gap-2 text-slate-600 text-sm mb-4">
          <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {establishment.endereco} - {establishment.bairro ? `${establishment.bairro}, ` : ''}
            {establishment.cidade}, {establishment.estado}
          </span>
          <a
            href={directionsUrl(establishment)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 font-bold hover:underline ml-2 text-xs"
          >
            Como chegar ↗
          </a>
        </div>

        <p className="text-base text-slate-700 leading-relaxed max-w-3xl">
          {establishment.descricao}
        </p>
      </header>

      {/* Galeria de Fotos Acessível */}
      <section aria-label="Fotos do Estabelecimento" className="mb-8">
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
          <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-100 relative mb-3">
            <img onError={imageFallback}
              src={photos[selectedPhotoIdx]}
              alt={`Foto principal de ${establishment.nome} mostrando entrada e instalações adaptadas`}
              className="w-full h-full object-cover transition-all"
            />
          </div>

          {photos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  aria-label={`Ver foto ${idx + 1} de ${photos.length}`}
                  className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedPhotoIdx === idx
                      ? 'border-blue-600 ring-2 ring-blue-400'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img onError={imageFallback} src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Layout Grid: Informações Práticas + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Coluna Esquerda: Informações de Contato e Horários */}
        <aside className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Informações de Contato & Horários
            </h2>

            <div className="space-y-4 text-sm">
              {establishment.horario_funcionamento && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Funcionamento</div>
                    <div className="text-slate-800 font-semibold">{establishment.horario_funcionamento}</div>
                  </div>
                </div>
              )}

              {establishment.telefone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Telefone</div>
                    <a
                      href={`tel:${establishment.telefone.replace(/\D/g, '')}`}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      {establishment.telefone}
                    </a>
                  </div>
                </div>
              )}

              {establishment.whatsapp && (
                <div className="flex items-start gap-3">
                  <MessageCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">WhatsApp (Suporte Acessível)</div>
                    <a
                      href={`https://wa.me/55${establishment.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      {establishment.whatsapp} ↗
                    </a>
                  </div>
                </div>
              )}

              {establishment.website && (
                <div className="flex items-start gap-3">
                  <Globe size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Site Oficial</div>
                    <a
                      href={establishment.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-bold hover:underline truncate block max-w-[200px]"
                    >
                      {establishment.website} ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Coluna Direita: Checklist de Critérios de Acessibilidade */}
        <div className="lg:col-span-2">
          <AccessibilityChecklist criteria={criteria} />
        </div>
      </div>

      {/* Seção de Avaliações da Comunidade */}
      <section aria-labelledby="reviews-heading" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 id="reviews-heading" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Star size={24} className="fill-amber-400 text-amber-500" aria-hidden="true" />
              Avaliações da Comunidade PCD
            </h2>
            <p className="text-xs text-slate-500">
              Relatos reais de quem experimentou a acessibilidade deste local
            </p>
          </div>

          {/* Filtro de avaliações por tipo de deficiência */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Filtrar por:</span>
            <button
              type="button"
              onClick={() => setReviewFilter('todas')}
              aria-pressed={reviewFilter === 'todas'}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                reviewFilter === 'todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({reviews.length})
            </button>
            {(['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'] as DisabilityType[]).map((type) => (
              <DisabilityBadge
                key={type}
                type={type}
                size="sm"
                active={reviewFilter === type}
                onClick={() => setReviewFilter(type)}
              />
            ))}
          </div>
        </div>

        {/* Lista de Avaliações */}
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-sm mb-8">
            Nenhuma avaliação encontrada para o filtro selecionado. Seja a primeira pessoa a avaliar!
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 transition-all hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-sm text-slate-900">{rev.user_nome}</div>
                    <DisabilityBadge type={rev.tipo_deficiencia_avaliada} size="sm" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < rev.nota ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{rev.data}</span>

                    <button
                      type="button"
                      onClick={() => handleReportReview(rev.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Denunciar avaliação abusiva ou falsa"
                      aria-label="Denunciar avaliação"
                    >
                      <Flag size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{rev.comentario}</p>
              </div>
            ))}
          </div>
        )}

        {/* Formulário: Adicionar Avaliação */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" aria-hidden="true" />
            Compartilhe sua experiência de acessibilidade
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Sua avaliação será publicada como <strong>Visitante da comunidade</strong>
          </p>

          {reviewSuccessMsg && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-2 text-sm font-semibold animate-fadeIn">
              <CheckCircle size={18} />
              <span>Avaliação enviada com sucesso! Obrigado por fortalecer a acessibilidade.</span>
            </div>
          )}

          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Qual acessibilidade você avaliou?
                </label>
                <select
                  value={newDisability}
                  onChange={(e) => setNewDisability(e.target.value as DisabilityType)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                >
                  {(['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'] as DisabilityType[]).map((t) => (
                    <option key={t} value={t}>
                      {DISABILITY_INFO[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sua Nota (1 a 5 estrelas)
                </label>
                <div className="flex items-center gap-1 py-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform"
                      aria-label={`Avaliar com ${star} estrelas`}
                    >
                      <Star
                        size={24}
                        className={star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-600 ml-2">{newRating} de 5</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Seu Relato Detalhado (Como foi a circulação, atendimento e recursos?)
              </label>
              <textarea
                id="review-comment"
                rows={3}
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Exemplo: Fui com cadeira de rodas e o acesso foi excelente, sem degraus. Os atendentes foram muito atenciosos..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <Send size={16} aria-hidden="true" />
              <span>{isSubmittingReview ? 'Enviando avaliação...' : 'Publicar Avaliação'}</span>
            </button>
          </form>
        </div>
      </section>
    </article>
  );
};

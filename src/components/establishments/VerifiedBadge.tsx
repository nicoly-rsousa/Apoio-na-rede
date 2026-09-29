import React, { useState } from 'react';
import { ShieldCheck, Info, X, Clock, AlertTriangle } from 'lucide-react';
import { EstablishmentStatus } from '../../types';

interface VerifiedBadgeProps {
  status: EstablishmentStatus;
  verificadoEm?: string;
  motivoRejeicao?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  status,
  verificadoEm,
  motivoRejeicao,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'pendente') {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold">
        <Clock size={14} aria-hidden="true" />
        <span>Em Análise</span>
      </div>
    );
  }

  if (status === 'rejeitado') {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-semibold" title={motivoRejeicao}>
        <AlertTriangle size={14} aria-hidden="true" />
        <span>Ajustes Necessários</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors text-xs font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Informações revisadas pelo Apoio na Rede. Saiba como funciona."
      >
        <ShieldCheck size={16} className="text-emerald-600" aria-hidden="true" />
        <span>Verificado</span>
        <Info size={12} className="text-emerald-600 ml-0.5 opacity-80" aria-hidden="true" />
      </button>

      {/* Modal Explicativo Acessível */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verified-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-slate-800"
            role="document"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Fechar explicação do selo verificado"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck size={28} aria-hidden="true" />
              </div>
              <div>
                <h3 id="verified-modal-title" className="text-lg font-bold text-slate-900">
                  O que é o Selo Verificado?
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  Registro revisado pela equipe
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed mb-6">
              <p>
                O selo <strong>Revisado pelo Apoio na Rede</strong> indica que as informações passaram por pelo menos uma destas etapas:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700 font-medium">
                <li>Conferência de fotos ou documentos enviados.</li>
                <li>Comparação com relatos recentes da comunidade.</li>
                <li>Contato com o responsável pelo local.</li>
              </ul>
              <p>As condições podem mudar. Em caso de dúvida, confirme diretamente com o local antes da visita.</p>
              {verificadoEm && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  📅 <strong>Data da última verificação:</strong> {verificadoEm}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

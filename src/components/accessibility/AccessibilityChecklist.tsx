import React, { useState } from 'react';
import { AccessibilityCriteria, DisabilityType } from '../../types';
import { DISABILITY_INFO } from './DisabilityBadge';
import { CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';

interface AccessibilityChecklistProps {
  criteria: AccessibilityCriteria[];
}

export const AccessibilityChecklist: React.FC<AccessibilityChecklistProps> = ({ criteria }) => {
  const [selectedTab, setSelectedTab] = useState<DisabilityType>('mobilidade');

  const disabilityTypes: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];

  // Agrupar critérios por tipo de deficiência
  const grouped = disabilityTypes.reduce((acc, type) => {
    acc[type] = criteria.filter((c) => c.tipo_deficiencia === type);
    return acc;
  }, {} as Record<DisabilityType, AccessibilityCriteria[]>);

  const currentList = grouped[selectedTab] || [];
  const currentInfo = DISABILITY_INFO[selectedTab];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={20} className="text-blue-600" aria-hidden="true" />
            Checklist de Critérios de Acessibilidade
          </h3>
          <p className="text-xs text-slate-500">
            Informações cadastradas por tipo de necessidade
          </p>
        </div>
      </div>

      {/* Tabs por tipo de deficiência */}
      <div
        role="tablist"
        aria-label="Categorias de Acessibilidade"
        className="flex flex-wrap gap-2 pb-3 mb-4 border-b border-slate-100"
      >
        {disabilityTypes.map((type) => {
          const info = DISABILITY_INFO[type];
          const Icon = info.icon;
          const count = grouped[type]?.filter((c) => c.presente).length || 0;
          const isSelected = selectedTab === type;

          return (
            <button
              key={type}
              role="tab"
              id={`tab-${type}`}
              aria-selected={isSelected}
              aria-controls={`panel-${type}`}
              onClick={() => setSelectedTab(type)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{info.shortLabel}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Tab Ativa */}
      <div
        id={`panel-${selectedTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${selectedTab}`}
        className="animate-fadeIn"
      >
        <div className="p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Foco de Atendimento: {currentInfo.label}
          </h4>
          <p className="text-xs text-slate-600">{currentInfo.description}</p>
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Nenhum critério registrado especificamente para esta categoria ainda.
          </div>
        ) : (
          <ul className="space-y-3">
            {currentList.map((crit) => (
              <li
                key={crit.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 transition-colors"
              >
                {crit.presente === true ? (
                  <CheckCircle2
                    size={20}
                    className="text-emerald-600 shrink-0 mt-0.5"
                    aria-label="Atendido"
                  />
                ) : crit.presente === false ? (
                  <XCircle
                    size={20}
                    className="text-rose-600 shrink-0 mt-0.5"
                    aria-label="Não"
                  />
                ) : <Info size={20} className="text-slate-500 shrink-0 mt-0.5" aria-label="Não verificado" />}
                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-800 leading-snug">
                    {crit.criterio}
                  </div>
                  <p className="text-xs text-slate-600">{crit.presente === true ? 'Sim' : crit.presente === false ? 'Não' : 'Não verificado'}</p>
                  {crit.observacao_livre && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                      <Info size={13} className="text-blue-600 shrink-0" aria-hidden="true" />
                      <span>{crit.observacao_livre}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

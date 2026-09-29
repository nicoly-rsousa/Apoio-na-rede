export function CatalogSkeleton() {
  return <section aria-label="Carregando locais" aria-busy="true" className="mb-12">
    <p role="status" className="mb-4 text-sm">Buscando locais…</p>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" aria-hidden="true">
      {[0, 1].map(index => <div key={index} className="premium-card overflow-hidden rounded-2xl">
        <div className="catalog-skeleton h-64" />
        <div className="p-5 space-y-4">
          <div className="catalog-skeleton h-6 w-2/3 rounded" />
          <div className="catalog-skeleton h-4 w-full rounded" />
          <div className="catalog-skeleton h-4 w-3/4 rounded" />
          <div className="flex gap-3"><div className="catalog-skeleton h-12 w-36 rounded-xl" /><div className="catalog-skeleton h-12 w-36 rounded-xl" /></div>
        </div>
      </div>)}
    </div>
  </section>;
}

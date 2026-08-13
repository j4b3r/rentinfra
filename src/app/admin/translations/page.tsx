import { createClient } from '@/lib/supabase/server'

export default async function AdminTranslations() {
  const supabase = await createClient()
  const { data: translations } = await supabase
    .from('translations')
    .select('*')
    .order('namespace')
    .order('key')

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[var(--ink)]">Translations</h1>
      <div className="op-panel p-6">
        <p className="mb-4 text-sm text-[var(--ink-soft)]">
          Manage dynamic content translations for English and Spanish. Static UI text is managed in{' '}
          <code className="bg-[var(--glass-seeded)] px-1">messages/en.json</code> and{' '}
          <code className="bg-[var(--glass-seeded)] px-1">messages/es.json</code>.
        </p>
        {translations && translations.length > 0 ? (
          <table className="op-table w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                <th className="px-3 py-2 text-left">Namespace</th>
                <th className="px-3 py-2 text-left">Key</th>
                <th className="px-3 py-2 text-left">Locale</th>
                <th className="px-3 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {translations.map((t: { id: string; namespace: string; key: string; locale: string; value: string }) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 text-[var(--ink-soft)]">{t.namespace}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--ink)]">{t.key}</td>
                  <td className="px-3 py-2 uppercase text-[var(--ink-soft)]">{t.locale}</td>
                  <td className="px-3 py-2 text-[var(--ink)]">{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[var(--ink-soft)]">No custom translations yet.</p>
        )}
      </div>
    </div>
  )
}

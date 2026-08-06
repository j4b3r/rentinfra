import { createClient } from '@/lib/supabase/server'

export default async function AdminTranslations() {
  const supabase = await createClient()
  const { data: translations } = await supabase
    .from('translations')
    .select('*')
    .order('namespace')
    .order('key')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A1F44] mb-6">Translations</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-sm mb-4">
          Manage dynamic content translations for English and Spanish. Static UI text is managed in <code className="bg-gray-100 px-1 rounded">messages/en.json</code> and <code className="bg-gray-100 px-1 rounded">messages/es.json</code>.
        </p>
        {translations && translations.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-3 py-2">Namespace</th>
                <th className="text-left px-3 py-2">Key</th>
                <th className="text-left px-3 py-2">Locale</th>
                <th className="text-left px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {translations.map((t: { id: string; namespace: string; key: string; locale: string; value: string }) => (
                <tr key={t.id} className="border-t border-gray-50">
                  <td className="px-3 py-2 text-gray-500">{t.namespace}</td>
                  <td className="px-3 py-2 font-mono text-xs">{t.key}</td>
                  <td className="px-3 py-2 uppercase text-gray-500">{t.locale}</td>
                  <td className="px-3 py-2 text-gray-700">{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400">No custom translations yet.</p>
        )}
      </div>
    </div>
  )
}

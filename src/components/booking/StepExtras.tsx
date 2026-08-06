'use client'

import { Addon } from '@/types'
import { WizardData } from './BookingWizard'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: WizardData
  update: (p: Partial<WizardData>) => void
  addons: Addon[]
  totalDays: number
  onBack: () => void
  onNext: () => void
}

export default function StepExtras({ data, update, addons, totalDays, onBack, onNext }: Props) {
  function toggleAddon(addon: Addon) {
    const exists = data.selectedAddons.find(a => a.addon.id === addon.id)
    if (exists) {
      update({ selectedAddons: data.selectedAddons.filter(a => a.addon.id !== addon.id) })
    } else {
      update({ selectedAddons: [...data.selectedAddons, { addon, quantity: 1 }] })
    }
  }

  function isSelected(addonId: string) {
    return data.selectedAddons.some(a => a.addon.id === addonId)
  }

  function addonCost(addon: Addon) {
    return addon.pricing_type === 'per_day' ? addon.price * totalDays : addon.price
  }

  return (
    <div className="space-y-5">
      <h3 className="font-bold text-[#0A1F44] text-lg">Select Extras</h3>
      <p className="text-sm text-gray-500">Optional add-ons to enhance your rental experience</p>

      {addons.length === 0 ? (
        <p className="text-gray-400 text-sm">No extras available for this car.</p>
      ) : (
        <div className="space-y-3">
          {addons.map(addon => {
            const selected = isSelected(addon.id)
            const cost = addonCost(addon)
            return (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selected ? 'border-[#0A1F44] bg-[#0A1F44]/5' : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected ? 'border-[#0A1F44] bg-[#0A1F44]' : 'border-gray-300'
                  }`}>
                    {selected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <p className="font-medium text-[#0A1F44] text-sm">{addon.name_en}</p>
                    {addon.description_en && (
                      <p className="text-xs text-gray-400">{addon.description_en}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#0A1F44]">{formatCurrency(cost)}</p>
                  <p className="text-xs text-gray-400">
                    {addon.pricing_type === 'per_day' ? `${formatCurrency(addon.price)}/day` : 'flat fee'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="flex-1 bg-[#0A1F44] text-white py-3 rounded-lg font-semibold hover:bg-[#C9A84C] hover:text-[#0A1F44] transition-colors">
          Continue →
        </button>
      </div>
    </div>
  )
}

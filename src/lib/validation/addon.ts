const PRICING_TYPES = ['per_day', 'flat']
const VEHICLE_TYPES = ['car', 'motorbike', 'bicycle']

export function validateAddon(body: Record<string, unknown>): Record<string, unknown> | { error: string } {
  const nameEn = String(body.name_en || '').trim()
  const nameEs = String(body.name_es || '').trim()
  const pricingType = body.pricing_type
  const price = Number(body.price)
  const vehicleType = body.vehicle_type || null

  if (!nameEn || !nameEs) return { error: 'Enter both English and Spanish names' }
  if (!PRICING_TYPES.includes(pricingType as string)) return { error: 'Invalid pricing type' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Enter a valid price' }
  if (vehicleType && !VEHICLE_TYPES.includes(vehicleType as string)) {
    return { error: 'Invalid vehicle type' }
  }

  return {
    name_en: nameEn,
    name_es: nameEs,
    description_en: (body.description_en as string)?.trim() || null,
    description_es: (body.description_es as string)?.trim() || null,
    icon: (body.icon as string)?.trim() || null,
    pricing_type: pricingType,
    price,
    is_global: body.is_global !== false,
    is_active: body.is_active !== false,
    vehicle_type: vehicleType,
  }
}

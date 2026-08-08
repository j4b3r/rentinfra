const LOCATION_TYPES = ['office', 'airport', 'hotel_delivery', 'custom']

export function validateLocation(body: Record<string, unknown>): Record<string, unknown> | { error: string } {
  const nameEn = String(body.name_en || '').trim()
  const nameEs = String(body.name_es || '').trim()
  const type = body.type
  const extraFee = body.extra_fee != null ? Number(body.extra_fee) : 0

  if (!nameEn || !nameEs) return { error: 'Enter both English and Spanish names' }
  if (!LOCATION_TYPES.includes(type as string)) return { error: 'Invalid location type' }
  if (!Number.isFinite(extraFee) || extraFee < 0) return { error: 'Enter a valid extra fee' }

  return {
    name_en: nameEn,
    name_es: nameEs,
    type,
    address: (body.address as string)?.trim() || null,
    extra_fee: extraFee,
    notes_en: (body.notes_en as string)?.trim() || null,
    notes_es: (body.notes_es as string)?.trim() || null,
    is_active: body.is_active !== false,
  }
}

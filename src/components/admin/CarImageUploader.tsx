'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Star, Loader2 } from 'lucide-react'

interface CarImageItem {
  id: string
  url: string
  is_primary: boolean
  storage_path?: string
}

interface Props {
  carId: string
  initialImages: CarImageItem[]
}

export default function CarImageUploader({ carId, initialImages }: Props) {
  const [images, setImages] = useState<CarImageItem[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`/api/admin/cars/${carId}/images`, { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        break
      }

      setImages(prev => [...prev, data.image])
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSetPrimary(imageId: string) {
    const res = await fetch(`/api/admin/cars/${carId}/images/${imageId}`, { method: 'PATCH' })
    if (res.ok) {
      setImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })))
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/admin/cars/${carId}/images/${imageId}`, { method: 'DELETE' })
    if (res.ok) {
      setImages(prev => {
        const remaining = prev.filter(img => img.id !== imageId)
        // If deleted was primary and there are remaining, promote first
        const wasDeleted = prev.find(img => img.id === imageId)
        if (wasDeleted?.is_primary && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_primary: true }
        }
        return remaining
      })
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-[#C9A84C] rounded-xl p-6 text-center cursor-pointer transition-colors group"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-gray-300 group-hover:text-[#C9A84C] mb-2 transition-colors" />
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
              Click or drag photos here
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Multiple files allowed</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
              <Image src={img.url} alt="Car photo" fill className="object-cover" />

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-1.5 left-1.5 bg-[#C9A84C] text-[#0A1F44] text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Star size={9} fill="currentColor" /> Cover
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    title="Set as cover"
                    className="text-white hover:text-[#C9A84C] transition-colors"
                  >
                    <Star size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  title="Delete"
                  className="text-white hover:text-red-400 transition-colors ml-auto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-xs text-gray-400 text-center">No photos yet</p>
      )}
    </div>
  )
}

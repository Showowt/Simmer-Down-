'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  folder?: string
}

export default function ImageUpload({ value, onChange, folder = 'menu' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // If bucket doesn't exist, fall back to URL input
        if (uploadError.message.includes('Bucket not found')) {
          setError('Image storage not configured. Use URL instead.')
          return
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      onChange(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Try using a URL instead.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover border border-[#3D3936]"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-[#1F1D1A]/80 hover:bg-red-500 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#3D3936] hover:border-[#FF6B35] cursor-pointer transition bg-[#1F1D1A]">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
          ) : (
            <>
              <Upload className="w-10 h-10 text-[#6B6560] mb-2" />
              <span className="text-sm text-[#6B6560]">Click to upload image</span>
              <span className="text-xs text-[#4A4744] mt-1">PNG, JPG up to 5MB</span>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* URL fallback input */}
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-[#6B6560]" />
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Or paste image URL..."
          className="flex-1 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
        />
      </div>
    </div>
  )
}

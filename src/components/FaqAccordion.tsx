'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Faq {
  id: string
  question_en: string
  answer_en: string
}

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {faqs.map(faq => (
        <div key={faq.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <button
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-[#0A1F44] text-sm pr-4">{faq.question_en}</span>
            <ChevronDown
              size={18}
              className={`text-[#C9A84C] shrink-0 transition-transform duration-200 ${openId === faq.id ? 'rotate-180' : ''}`}
            />
          </button>
          {openId === faq.id && (
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
              <div className="pt-3">{faq.answer_en}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { AlertCircle, Check, X, Image } from 'lucide-react'
import { API_BASE } from '@/lib/config'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function MeterFeedbackBanner() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [comment, setComment] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    try {
      const res = await api.get('/meter-feedback/pending')
      setFeedbacks(res.data.feedbacks || [])
    } catch {
      // silently fail
    }
  }

  const respond = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/meter-feedback/${id}`, { status, comment: status === 'rejected' ? comment : undefined })
      toast.success(status === 'approved' ? 'Đã xác nhận chỉ số điện' : 'Đã từ chối chỉ số điện')
      setFeedbacks(prev => prev.filter(f => f._id !== id))
      setActiveId(null)
      setComment('')
    } catch {
      toast.error('Không thể cập nhật')
    }
  }

  if (feedbacks.length === 0) return null

  return (
    <div className="space-y-3">
      {feedbacks.map((fb: any) => (
        <div key={fb._id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Chủ trọ {fb.landlordId?.name} gửi chỉ số điện mới cho phòng {fb.roomId?.name}
              </p>
              {fb.readingId && (
                <div className="mt-2 bg-white rounded-lg p-3 border border-amber-100 text-sm">
                  <p className="text-gray-700">Chỉ số: <span className="font-bold">{fb.readingId.value} kWh</span></p>
                  {fb.readingId.consumption > 0 && (
                    <p className="text-gray-600">Tiêu thụ: {fb.readingId.consumption} kWh — Chi phí: {fb.readingId.cost?.toLocaleString('vi-VN')}đ</p>
                  )}
                  {fb.readingId.imagePath && (
                    <div className="mt-2">
                      <a href={`${API_BASE}/${fb.readingId.imagePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                        <Image size={14} /> Xem ảnh đồng hồ
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Ngày: {new Date(fb.readingId.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}

              {activeId === fb._id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Lý do từ chối (tùy chọn)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => respond(fb._id, 'rejected')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
                      Xác nhận từ chối
                    </button>
                    <button onClick={() => { setActiveId(null); setComment('') }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50">
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => respond(fb._id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
                  >
                    <Check size={14} /> Đồng ý
                  </button>
                  <button
                    onClick={() => setActiveId(fb._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                  >
                    <X size={14} /> Không đồng ý
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

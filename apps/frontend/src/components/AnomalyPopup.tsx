import { useEffect, useState } from 'react'
import { AlertTriangle, X, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useRoomStore } from '@/stores/roomStore'

export default function AnomalyPopup() {
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [show, setShow] = useState(false)
  const [avgConsumption, setAvgConsumption] = useState('')
  const navigate = useNavigate()
  const { selectedRoom } = useRoomStore()

  useEffect(() => {
    // Only show once per session
    const shown = sessionStorage.getItem('anomaly-popup-shown')
    if (shown) return

    const checkAnomalies = async () => {
      try {
        const params: any = {}
        if (selectedRoom?._id) params.roomId = selectedRoom._id
        const res = await api.get('/ai/anomalies', { params })
        if (res.data.hasAnomaly && res.data.anomalies?.length > 0) {
          setAnomalies(res.data.anomalies)
          setAvgConsumption(res.data.avgConsumption)
          setShow(true)
          sessionStorage.setItem('anomaly-popup-shown', '1')
        }
      } catch {
        // silently fail
      }
    }

    // Delay a bit so dashboard loads first
    const timer = setTimeout(checkAnomalies, 2000)
    return () => clearTimeout(timer)
  }, [selectedRoom?._id])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in">
        {/* Header */}
        <div className="bg-red-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle size={22} />
            <h3 className="font-bold text-lg">Cảnh báo bất thường</h3>
          </div>
          <button onClick={() => setShow(false)} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700">
            Hệ thống phát hiện <span className="font-bold text-red-600">{anomalies.length} bất thường</span> trong tiêu thụ điện của bạn:
          </p>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {anomalies.slice(0, 3).map((a: any, i: number) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">{a.message}</p>
                <p className="text-xs text-red-600 mt-1">
                  {new Date(a.date).toLocaleDateString('vi-VN')} — {a.consumption.toFixed(1)} kWh
                </p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              Trung bình tiêu thụ: <span className="font-bold">{avgConsumption} kWh</span>. 
              Hãy kiểm tra thiết bị điện hoặc hỏi AI Chatbot để được tư vấn chi tiết.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => setShow(false)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Đã hiểu
          </button>
          <button
            onClick={() => {
              setShow(false)
              // Open AI chatbot by dispatching custom event
              window.dispatchEvent(new CustomEvent('open-ai-chatbot'))
            }}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            Hỏi AI
          </button>
        </div>
      </div>
    </div>
  )
}

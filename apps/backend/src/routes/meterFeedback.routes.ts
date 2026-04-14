import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import MeterFeedback from '../models/MeterFeedback.model.js'
import MeterReading from '../models/MeterReading.model.js'
import Room from '../models/Room.model.js'

const router = Router()
router.use(authenticate)

// Landlord: create feedback request when uploading reading for tenant
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { readingId, roomId } = req.body
    const landlordId = req.user?.id

    const room = await Room.findById(roomId)
    if (!room || room.landlordId.toString() !== landlordId) {
      return res.status(403).json({ error: 'Không có quyền' })
    }
    if (!room.tenantId) {
      return res.status(400).json({ error: 'Phòng chưa có người thuê' })
    }

    const feedback = await MeterFeedback.create({
      readingId,
      roomId,
      landlordId,
      tenantId: room.tenantId,
      status: 'pending',
    })

    res.status(201).json(feedback)
  } catch (error) {
    console.error('Create feedback error:', error)
    res.status(500).json({ error: 'Không thể tạo yêu cầu xác nhận' })
  }
})

// Tenant: get pending feedbacks
router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.id
    const feedbacks = await MeterFeedback.find({ tenantId, status: 'pending' })
      .populate('readingId')
      .populate('roomId', 'name')
      .populate('landlordId', 'name')
      .sort({ createdAt: -1 })

    res.json({ feedbacks })
  } catch (error) {
    console.error('Get pending feedbacks error:', error)
    res.status(500).json({ error: 'Không thể tải danh sách' })
  }
})

// Tenant: respond to feedback (approve/reject)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.id
    const { status, comment } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' })
    }

    const feedback = await MeterFeedback.findOne({ _id: req.params.id, tenantId })
    if (!feedback) {
      return res.status(404).json({ error: 'Không tìm thấy' })
    }

    feedback.status = status
    if (comment) feedback.tenantComment = comment
    await feedback.save()

    res.json({ message: status === 'approved' ? 'Đã xác nhận chỉ số' : 'Đã từ chối chỉ số', feedback })
  } catch (error) {
    console.error('Update feedback error:', error)
    res.status(500).json({ error: 'Không thể cập nhật' })
  }
})

// Landlord: get feedback status for a room
router.get('/room/:roomId', async (req: AuthRequest, res: Response) => {
  try {
    const feedbacks = await MeterFeedback.find({ roomId: req.params.roomId })
      .populate('readingId')
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ feedbacks })
  } catch (error) {
    console.error('Get room feedbacks error:', error)
    res.status(500).json({ error: 'Không thể tải' })
  }
})

export default router

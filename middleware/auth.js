const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme hatası' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz token' })
  }
} 
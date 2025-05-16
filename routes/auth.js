const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Middleware - Token doğrulama
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme hatası' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar')
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

// Kayıt ol
router.post('/kayit', async (req, res) => {
  try {
    const { ad, soyad, email, telefon, sifre } = req.body

    // Email kontrolü
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' })
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(sifre, salt)

    // Yeni kullanıcı oluştur
    const user = new User({
      ad,
      soyad,
      email,
      telefon,
      sifre: hashedPassword
    })

    await user.save()

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        ad: user.ad,
        soyad: user.soyad,
        email: user.email,
        telefon: user.telefon
      }
    })
  } catch (error) {
    console.error('Kayıt hatası:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// Giriş yap
router.post('/giris', async (req, res) => {
  try {
    const { email, sifre } = req.body

    // Kullanıcıyı bul
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre' })
    }

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(sifre, user.sifre)
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre' })
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        ad: user.ad,
        soyad: user.soyad,
        email: user.email,
        telefon: user.telefon
      }
    })
  } catch (error) {
    console.error('Giriş hatası:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// Profil güncelleme
router.put('/profile', auth, async (req, res) => {
  try {
    const { ad, soyad, email, telefon } = req.body

    // E-posta değiştiyse ve başka bir kullanıcı tarafından kullanılıyorsa
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' })
      }
    }

    // Kullanıcı bilgilerini güncelle
    req.user.ad = ad
    req.user.soyad = soyad
    req.user.email = email
    req.user.telefon = telefon

    await req.user.save()

    res.json({
      user: {
        id: req.user._id,
        ad: req.user.ad,
        soyad: req.user.soyad,
        email: req.user.email,
        telefon: req.user.telefon
      }
    })
  } catch (error) {
    console.error('Profil güncelleme hatası:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

module.exports = router 
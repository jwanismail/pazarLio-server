const express = require('express')
const router = express.Router()
const Ilan = require('../models/Ilan')
const auth = require('../middleware/auth')

// Kullanıcının ilanlarını getir
router.get('/benim-ilanlarim', auth, async (req, res) => {
  try {
    const ilanlar = await Ilan.find({ sahibi: req.user._id })
    res.json(ilanlar)
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// Yeni ilan oluştur
router.post('/', auth, async (req, res) => {
  try {
    const ilan = new Ilan({
      ...req.body,
      sahibi: req.user._id
    })
    await ilan.save()
    res.status(201).json(ilan)
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// İlan güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const ilan = await Ilan.findOne({ _id: req.params.id, sahibi: req.user._id })
    if (!ilan) {
      return res.status(404).json({ message: 'İlan bulunamadı' })
    }

    Object.assign(ilan, req.body)
    await ilan.save()
    res.json(ilan)
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// İlan sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const ilan = await Ilan.findOneAndDelete({ _id: req.params.id, sahibi: req.user._id })
    if (!ilan) {
      return res.status(404).json({ message: 'İlan bulunamadı' })
    }
    res.json({ message: 'İlan silindi' })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

module.exports = router 
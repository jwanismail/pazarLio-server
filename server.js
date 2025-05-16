const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// MongoDB bağlantısı
mongoose.connect('mongodb://127.0.0.1:27017/ilan-sitesi', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err))

// İlan şeması
const ilanSchema = new mongoose.Schema({
  baslik: String,
  aciklama: String,
  fiyat: Number,
  konum: String,
  iletisim: String,
  resimler: [String],
  kategori: String,
  kullaniciAdi: String,
  satildi: Boolean,
  tarih: Date
})

// İlan modeli
const Ilan = mongoose.models.Ilan || mongoose.model('Ilan', ilanSchema)

// Test endpoint'i
app.get('/test', (req, res) => {
  res.json({ message: 'Server çalışıyor!' })
})

// İlan ekleme endpoint'i
app.post('/api/ilanlar', async (req, res) => {
  try {
    console.log('Gelen veri:', req.body)

    // Veri doğrulama
    const { baslik, aciklama, fiyat, konum, kategori, resimler, kullaniciAdi, iletisim } = req.body

    if (!baslik || !aciklama || !fiyat || !konum || !kategori || !kullaniciAdi || !iletisim) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm gerekli alanları doldurun'
      })
    }

    // Yeni ilan oluştur
    const yeniIlan = new Ilan({
      baslik,
      aciklama,
      fiyat: Number(fiyat),
      konum,
      kategori,
      iletisim,
      resimler: resimler || [],
      kullaniciAdi,
      satildi: false,
      tarih: new Date()
    })

    console.log('Oluşturulan ilan:', yeniIlan);

    // MongoDB'ye kaydet
    const kaydedilenIlan = await yeniIlan.save()
    console.log('Kaydedilen ilan:', kaydedilenIlan)

    res.status(201).json({
      success: true,
      message: 'İlan başarıyla eklendi',
      ilan: kaydedilenIlan
    })
  } catch (error) {
    console.error('İlan ekleme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'İlan eklenirken bir hata oluştu: ' + error.message
    })
  }
})

// İlanları listeleme
app.get('/api/ilanlar', async (req, res) => {
  try {
    console.log('İlanlar listeleme isteği alındı:', req.query)
    
    const { page = 1, limit = 20, search = '', category = '', showSold = true } = req.query
    
    // Arama ve filtreleme kriterleri
    const query = {}
    
    if (search) {
      query.$or = [
        { baslik: { $regex: search, $options: 'i' } },
        { aciklama: { $regex: search, $options: 'i' } },
        { konum: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (category) {
      query.kategori = category
    }
    
    if (!showSold) {
      query.satildi = false
    }

    console.log('MongoDB sorgusu:', query)

    // Toplam ilan sayısını al
    const totalIlanlar = await Ilan.countDocuments(query)
    console.log('Toplam ilan sayısı:', totalIlanlar)
    
    const totalPages = Math.ceil(totalIlanlar / limit)

    // İlanları getir
    const ilanlar = await Ilan.find(query)
      .sort({ tarih: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    console.log('Bulunan ilan sayısı:', ilanlar.length)

    res.json({
      success: true,
      ilanlar,
      totalPages,
      totalIlanlar,
      currentPage: Number(page)
    })
  } catch (error) {
    console.error('İlanları listeleme hatası - Detaylı:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    })
    res.status(500).json({
      success: false,
      message: 'İlanlar listelenirken bir hata oluştu',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// İlan detayı
app.get('/api/ilanlar/:id', async (req, res) => {
  try {
    const ilan = await Ilan.findById(req.params.id)
    if (!ilan) {
      return res.status(404).json({ 
        success: false,
        message: 'İlan bulunamadı' 
      })
    }
    res.json({
      success: true,
      ilan
    })
  } catch (err) {
    console.error('İlan detayı hatası:', err)
    res.status(500).json({ 
      success: false,
      message: 'İlan detayı alınırken bir hata oluştu',
      error: err.message 
    })
  }
})

// İlan güncelleme
app.put('/api/ilanlar/:id', async (req, res) => {
  try {
    const ilan = await Ilan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!ilan) {
      return res.status(404).json({ error: 'İlan bulunamadı' })
    }
    res.json(ilan)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// İlan silme
app.delete('/api/ilanlar/:id', async (req, res) => {
  try {
    const ilan = await Ilan.findByIdAndDelete(req.params.id)
    if (!ilan) {
      return res.status(404).json({ error: 'İlan bulunamadı' })
    }
    res.json({ message: 'İlan silindi' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Kullanıcının ilanlarını getirme
app.get('/api/ilanlar/kullanici/:kullaniciAdi', async (req, res) => {
  try {
    const ilanlar = await Ilan.find({ kullaniciAdi: req.params.kullaniciAdi })
      .sort({ tarih: -1 })
    
    res.json({
      success: true,
      ilanlar
    })
  } catch (error) {
    console.error('Kullanıcı ilanları getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'İlanlar getirilirken bir hata oluştu',
      error: error.message
    })
  }
})

// Port ayarı
const PORT = 5001

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`)
})
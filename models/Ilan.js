const mongoose = require('mongoose')

const ilanSchema = new mongoose.Schema({
  baslik: {
    type: String,
    required: [true, 'Başlık alanı zorunludur'],
    trim: true
  },
  aciklama: {
    type: String,
    required: [true, 'Açıklama alanı zorunludur'],
    trim: true
  },
  fiyat: {
    type: Number,
    required: [true, 'Fiyat alanı zorunludur'],
    min: [0, 'Fiyat 0\'dan küçük olamaz']
  },
  kategori: {
    type: String,
    required: [true, 'Kategori alanı zorunludur'],
    enum: ['Emlak', 'Vasıta', 'Elektronik', 'Ev Eşyası', 'İş Makineleri', 'Diğer']
  },
  resimler: [{
    type: String,
    required: [true, 'En az bir resim gereklidir']
  }],
  konum: {
    type: String,
    required: [true, 'Konum alanı zorunludur']
  },
  durum: {
    type: String,
    enum: ['Aktif', 'Satıldı', 'Pasif'],
    default: 'Aktif'
  },
  sahibi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Güncelleme tarihini otomatik güncelle
ilanSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('Ilan', ilanSchema) 
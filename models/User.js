const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: [true, 'Ad alanı zorunludur'],
    trim: true
  },
  soyad: {
    type: String,
    required: [true, 'Soyad alanı zorunludur'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email alanı zorunludur'],
    unique: true,
    trim: true,
    lowercase: true
  },
  telefon: {
    type: String,
    required: [true, 'Telefon alanı zorunludur'],
    trim: true
  },
  sifre: {
    type: String,
    required: [true, 'Şifre alanı zorunludur']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Şifreyi hashle
userSchema.pre('save', async function(next) {
  if (!this.isModified('sifre')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.sifre = await bcrypt.hash(this.sifre, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.sifre)
}

module.exports = mongoose.model('User', userSchema) 
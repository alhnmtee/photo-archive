# Aile Fotoğraf Arşivi

Bu proje, ailelerin fotoğraflarını yıllara göre düzenleyip arşivleyebilecekleri, aile üyelerini etiketleyebilecekleri ve aile ağacı oluşturabilecekleri bir web uygulamasıdır.

## 🚀 Özellikler

- 📸 Fotoğraf yükleme ve yönetimi
- 👥 Kişi etiketleme sistemi
- 📅 Yıllara göre fotoğraf organizasyonu
- 🗂️ Albüm oluşturma ve yönetimi
- 🌳 Aile ağacı görüntüleme
- 💬 Fotoğraflara yorum yapabilme
- 🌓 Açık/Koyu tema desteği
- 🔒 Kullanıcı yetkilendirme sistemi

## 🛠️ Kullanılan Teknolojiler

- React
- TypeScript
- Chakra UI
- React Router
- React Query (TanStack Query)
- Firebase Authentication
- Vite

## 💻 Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullanici-adi/aile-fotograf-arsivi.git
cd aile-fotograf-arsivi
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun:
```env
VITE_STORAGE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. Uygulamayı başlatın:
```bash
npm run dev
```

## 📁 Proje Yapısı

```
src/
├── components/         # Yeniden kullanılabilir bileşenler
├── contexts/          # Context API tanımlamaları
├── pages/             # Sayfa bileşenleri
├── services/          # API servisleri
├── config/            # Yapılandırma dosyaları
└── utils/             # Yardımcı fonksiyonlar
```

## 🔑 Anahtar Bileşenler

- **PhotoGrid**: Fotoğrafları grid görünümünde sergiler
- **PhotoViewer**: Fotoğraf detay görüntüleyici
- **DashboardLayout**: Ana sayfa düzeni
- **SimpleFamilyTree**: Aile ağacı görüntüleyici
- **PhotoUploadModal**: Fotoğraf yükleme arayüzü

## 📱 Görünüm Modları

Uygulama aşağıdaki görünüm modlarını destekler:
- Grid Görünümü
- Liste Görünümü
- Zaman Çizelgesi
- Takvim Görünümü
- Kişilere Göre Görünüm

## 🔐 Kullanıcı Yetkilendirmesi

Uygulama şu giriş yöntemlerini destekler:
- Email/Şifre ile giriş
- Google ile giriş
- Apple ile giriş

## 🤝 Katkıda Bulunma

1. Bu projeyi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

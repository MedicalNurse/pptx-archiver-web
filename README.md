# PPTX Silent Archiver — Web Dashboard & Yapay Zeka Destekli Ders Asistanı

Bu dizin, yerel sunum yedekleyici sisteminiz (`pptx_archiver.py`) için geliştirilmiş modern, responsive ve **yapay zeka entegrasyonlu** web arayüzünü içerir. Bu panel sayesinde hem yedeklerinizi yönetebilir hem de tıp fakültesi ders notlarınızın içeriklerini yapay zeka ile analiz edebilirsiniz.

---

## 🌟 Öne Çıkan Özellikler

1. **Otomatik Yapay Zeka Tasnifi (AI Categorization):** Drive'a yedeklenen tıp ders notları (PPTX), arka plan servisi tarafından slayt metinleri çıkarılarak analiz edilir. **Gemini 2.5 Flash** veya kural tabanlı fallback sistemiyle dersine göre (örn. *Anatomi*, *Biyokimya*, *Fizyoloji*) otomatik alt klasörlere ayrıştırılır.
2. **Canlı Ders Notu Asistanı (AI Chat):** Dashboard üzerindeki yerel veya bulut dosyalarının yanındaki **"Sor"** butonuna basarak sağdan açılan sohbet panelinde asistanla konuşabilirsiniz. Ders notunu özetletebilir, 5 adet çalışma sorusu çıkartabilir veya önemli tıbbi terimleri açıklatabilirsiniz.
3. **Kolay Bağlantı Testi:** Ayarlar modalında bulunan **"Test Et"** butonu sayesinde Gemini API anahtarınızın doğruluğunu anlık olarak test edebilirsiniz.
4. **Hafif ve Güvenli:** Herhangi bir veritabanı veya karmaşık sunucu kurulumu gerektirmez. API Anahtarları ve giriş bilgileri tamamen yerel bilgisayarınızda (`config.json`) ve tarayıcınızda (`localStorage`) saklanır.

---

## 🚀 1. Adım: Yerel Servisi Başlatma

Arayüzün bilgisayarınızdaki yedekleme durumunu izleyebilmesi, yerel dosyaları listeleyebilmesi ve AI isteklerini işleyebilmesi için servis başlatıcısını çalıştırmanız gerekir:

```bash
# Gerekli bağımlılıkları kurun (önceden kurulu değilse)
pip install psutil pystray google-api-python-client google-auth-oauthlib watchdog pillow

# Servis başlatıcıyı çalıştırın
python pptx_archiver_service.py
```

*Not: `pptx_archiver_service.py` dosyasını çalıştırdığınızda program arka planda sessizce çalışır ve sağ altta sistem tepsisinde (Tray) yer alır. Aynı zamanda `http://localhost:58291` portunda tarayıcıyla konuşan güvenli bir API köprüsü (bridge) açar.*

---

## 🔑 2. Adım: Google Cloud Web Client ID Oluşturma

Tarayıcının doğrudan ve güvenli bir şekilde Google Drive hesabınıza erişebilmesi için bir **Web Client ID**'ye ihtiyacınız vardır:

1. [Google Cloud Console](https://console.cloud.google.com) adresine gidin.
2. Sol menüden **APIs & Services > Credentials** bölümüne geçin.
3. Üstten **+ Create Credentials > OAuth client ID** butonuna tıklayın.
4. **Application type** olarak **Web application** seçin.
5. **Authorized JavaScript origins** kısmına aşağıdaki adresleri ekleyin:
   * `http://localhost:58291` (Yerel bilgisayar testleri için)
   * `https://[github-kullanıcı-adınız].github.io` (GitHub Pages siteniz için)
6. **Create** butonuna tıklayıp oluşturulan **Client ID** değerini kopyalayın.
7. Web panelinde sağ üstteki çark (Ayarlar) simgesine tıklayarak bu Client ID'yi yapıştırın.

---

## 🧠 3. Adım: Yapay Zeka (Gemini) Kurulumu ve Bağlantı Testi

Ders notlarının otomatik kategorilere ayrılması ve ders notları asistanı ile konuşabilmek için bir Gemini API Anahtarı girmeniz gerekir:

1. [Google AI Studio](https://aistudio.google.com/) adresine giderek ücretsiz bir **Gemini API Key** (API Anahtarı) oluşturun.
2. Web panelinde sağ üstteki çark (Ayarlar) simgesine tıklayın.
3. **Gemini API Anahtarı** alanına bu anahtarı yapıştırın.
4. Altındaki **"Test Et"** butonuna basarak API bağlantınızın aktif olduğunu yeşil renkli **"API bağlantısı başarılı!"** mesajı ile doğrulayın.
5. **"Ayarları Kaydet"** butonuna tıklayarak işlemi tamamlayın. Anahtarınız yerel sunucunuzdaki `config.json` dosyasına güvenli bir şekilde kaydedilecektir.

---

## 💬 4. Adım: Yapay Zeka Canlı Ders Asistanı Kullanımı

1. Dashboard üzerindeki **"Bilgisayardaki Yerel Arşivler"** listesindeki herhangi bir dosyanın yanındaki **sohbet balonu** butonuna tıklayın ya da **"Bulut Arşivleri (Google Drive)"** altındaki bir dosya kartında bulunan **"Sor"** butonuna basın.
2. Sağ taraftan açılan yapay zeka paneli, seçtiğiniz ders notunun slayt içeriklerini otomatik olarak okuyacak ve sizinle o bağlamda sohbete başlayacaktır.
3. Paneldeki hazır butonları kullanarak tek tıkla şunları yapabilirsiniz:
   * 📝 **Notu Özetle:** Ders notunun ana hatlarını ve konusunu çıkarır.
   * ❓ **5 adet çalışma sorusu çıkar:** Sınavlara hazırlanmanız için slayt içeriğinden sorular ve cevap anahtarı hazırlar.
   * 🔬 **Önemli terimleri açıkla:** Derste geçen Latince/tıbbi kavramları ve tanımlarını listeler.
4. İsterseniz aşağıdaki mesaj kutusundan serbestçe sorularınızı (örn. *"Bu sunumda kemik eklemleri hakkında ne söyleniyor?"*) yöneltebilirsiniz.

---

## 🌐 5. Adım: GitHub Pages ile İnternette Yayınlama

Web sitenizi herkesin erişebileceği şekilde GitHub Pages üzerinde ücretsiz olarak yayınlamak için:

1. GitHub üzerinde yeni bir **Public** (Açık) depo (repository) oluşturun (Örn: `pptx-archiver-web`).
2. Bilgisayarınızdaki `web` klasörünün **içindeki** dosyaları (`index.html`, `index.css`, `app.js`, `README.md`) bu depoya yükleyin (Commit & Push).
   * *Önemli: `credentials.json`, `token.json` veya `config.json` dosyalarını kesinlikle GitHub'a **yüklemeyin**! Bu web paneli tamamen sunucusuz/istemci tabanlı çalışır ve hassas verileri yerel bilgisayarınızda saklar.*
3. GitHub deposunda üst menüden **Settings > Pages** sekmesine gidin.
4. **Build and deployment** başlığı altında:
   * Source: `Deploy from a branch`
   * Branch: `main` (veya `master`) ve `/ (root)` seçerek **Save** butonuna tıklayın.
5. Birkaç dakika sonra yayındaki linkiniz hazır olacaktır (Örn: `https://[kullanıcı-adınız].github.io/pptx-archiver-web/`).
6. **Önemli:** Bu linki kopyalayıp 2. Adımdaki Google Cloud Console'daki **Authorized JavaScript origins** listenize eklemeyi unutmayın!

# PPTX Silent Archiver — Web Dashboard & Service Bridge

Bu dizin, yerel sunum yedekleyici sisteminiz (`pptx_archiver.py`) için geliştirilmiş modern ve responsive web arayüzünü içerir. Bu sayede tarayıcınızdan Google Drive'a yedeklenen tüm dosyaları tarih bazlı görebilir, arayabilir, önizleyebilir veya indirebilirsiniz.

## 🚀 1. Adım: Yerel Servisi Başlatma

Arayüzün bilgisayarınızdaki programın durumunu (Aktif/Pasif) algılayabilmesi ve yerel kopyaları listeleyebilmesi için yeni servis başlatıcısını çalıştırmanız gerekir:

```bash
# Gerekli bağımlılıkları kurun (önceden kurulu değilse)
pip install psutil pystray google-api-python-client google-auth-oauthlib watchdog pillow

# Servis başlatıcıyı çalıştırın
python pptx_archiver_service.py
```

*Not: `pptx_archiver_service.py` dosyasını çalıştırdığınızda program arka planda sessizce çalışır ve sağ altta sistem tepsisinde (Tray) yer alır. Aynı zamanda `http://localhost:58291` portunda tarayıcıyla konuşan güvenli bir API köprüsü açar.*

---

## 🔑 2. Adım: Google Cloud Web Client ID Oluşturma

Tarayıcının doğrudan ve güvenli bir şekilde Google Drive hesabınıza erişebilmesi için bir **Web Client ID**'ye ihtiyacınız vardır:

1. [Google Cloud Console](https://console.cloud.google.com) adresine gidin.
2. Sol menüden **APIs & Services > Credentials** (API'ler ve Servisler > Kimlik Bilgileri) bölümüne geçin.
3. Üstten **+ Create Credentials > OAuth client ID** butonuna tıklayın.
4. **Application type** olarak **Web application** seçin.
5. **Name** alanına istediğiniz bir ad verin (Örn: `PPTX Dashboard Web`).
6. **Authorized JavaScript origins** (Yetkilendirilmiş JavaScript kaynakları) kısmına aşağıdaki adresleri ekleyin:
   * `http://localhost:58291` (Yerel bilgisayar testleri için)
   * `https://[github-kullanıcı-adınız].github.io` (GitHub Pages siteniz için)
7. **Create** butonuna tıklayın. Karşınıza çıkan pencereden **Client ID** değerini kopyalayın (Örn: `123456789-abc.apps.googleusercontent.com`).
8. Web panelindeki sağ üstteki çark simgesine tıklayarak bu Client ID'yi yapıştırın ve **Kaydet**'e basın.

---

## 🌐 3. Adım: GitHub Pages ile İnternette Yayınlama

Web sitenizi herkesin erişebileceği şekilde GitHub Pages üzerinde ücretsiz olarak yayınlamak için:

1. [GitHub](https://github.com) üzerinde yeni bir **Public** (Açık) depo (repository) oluşturun (Örn: `pptx-archiver-web`).
2. Bilgisayarınızdaki `web` klasörünün **içindeki** dosyaları (`index.html`, `index.css`, `app.js`) bu depoya yükleyin (Commit & Push).
   * *Önemli: `credentials.json` veya `token.json` dosyalarını kesinlikle GitHub deposuna **yüklemeyin**! Bu web paneli tamamen sunucusuz çalışır ve giriş bilgilerini lokal saklar.*
3. GitHub deposunda üst menüden **Settings** (Ayarlar) sekmesine gidin.
4. Sol menüden **Pages** kısmına tıklayın.
5. **Build and deployment** başlığı altında:
   * Source: `Deploy from a branch`
   * Branch: `main` (veya `master`) ve `/ (root)` seçin.
   * **Save** butonuna tıklayın.
6. Birkaç dakika sonra sayfanın üstünde sitenizin yayındaki linki görünecektir (Örn: `https://[kullanıcı-adınız].github.io/pptx-archiver-web/`).
7. **Önemli:** Bu linki kopyalayıp 2. Adımdaki Google Cloud Console'daki **Authorized JavaScript origins** listenize ekleyin.

Artık oluşturduğunuz bu GitHub Pages linki üzerinden dünyanın her yerinden yedeklerinizi yönetebilir, bilgisayarınızda programın çalışıp çalışmadığını izleyebilirsiniz!

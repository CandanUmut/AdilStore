import { getState, setState } from './state.js';

const translations = {
  en: {
    heroKicker: 'Privacy-first · Heart-friendly',
    heroTitle: 'AdilStore · Respectful apps',
    heroSubtitle: 'A warm collection of handcrafted tools, mindful games, and spiritual companions that protect your focus, privacy, and dignity.',
    heroNote: 'Gentle, family-friendly experiences built with intention.',
    heroAppTagline: 'Featured today: a fresh daily pick',
    categories: {
      all: 'All apps',
      spiritual: 'Spiritual growth',
      wellness: 'Wellbeing & mind',
      learning: 'Learning & reflection',
      games: 'Games & play',
      tools: 'Tools & utilities',
      environment: 'Environment & care',
      'self-assessment': 'Self-assessment',
    },
    searchPlaceholder: 'Search apps, tags, or hopes…',
    results: { single: 'app', plural: 'apps' },
    metrics: {
      apps: 'Apps live',
      privacy: 'Privacy & kindness',
      privacyValue: 'No ads · No trackers',
      platforms: 'Platforms',
      platformsValue: 'Web & Android',
    },
    buttons: {
      open: 'Open app',
      openPlay: 'Open on Google Play',
      live: 'Live preview',
      hide: 'Hide preview',
      unavailable: 'Preview unavailable',
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      back: 'Back',
      viewAll: 'View all',
      share: 'Share',
      install: 'Install',
    },
    nav: {
      home: 'Home',
      devPortal: 'Developer Portal',
      submitApp: 'Submit App',
      myApps: 'My Apps',
      reviewQueue: 'Review Queue',
      profile: 'Profile',
    },
    auth: {
      loginTitle: 'Sign in to AdilStore',
      registerTitle: 'Create your account',
      email: 'Email',
      password: 'Password',
      displayName: 'Display name',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      orContinueWith: 'Or continue with',
    },
    developer: {
      portalTitle: 'Developer Portal',
      applyTitle: 'Become a Developer',
      applySubtitle: 'Submit your developer profile for review. We manually verify every developer.',
      dashboardTitle: 'Dashboard',
      website: 'Website',
      description: 'About you / your organization',
      pending: 'Your developer application is under review.',
      rejected: 'Your developer application was not approved.',
      submitApp: 'Submit a New App',
      editApp: 'Edit App',
      installs: 'Installs',
      ratings: 'Avg Rating',
      versions: 'Versions',
      status: 'Status',
    },
    submission: {
      title: 'Submit your app',
      subtitle: 'Share a respectful, ad-free, privacy-friendly app. We review every submission by hand.',
      appName: 'App name',
      appUrl: 'App URL',
      category: 'Category',
      contactEmail: 'Contact email',
      description: 'Short description (why is it good for AdilStore?)',
      descriptionEn: 'Description (English)',
      descriptionTr: 'Description (Turkish)',
      extraNotes: 'Extra notes (open source links, licenses, etc.)',
      icon: 'App icon',
      iconHint: 'Max ~1MB, square image looks best.',
      screenshots: 'Screenshots (up to 5)',
      tags: 'Tags (comma-separated)',
      platforms: 'Platforms',
      privacyUrl: 'Privacy policy URL',
      sourceUrl: 'Source code URL (if open source)',
      version: 'Version',
      success: 'Thank you! Your app submission has been received. We will review it manually before publishing.',
      error: 'Something went wrong. Please try again later.',
      sending: 'Sending...',
    },
    appDetail: {
      aboutApp: 'About this app',
      ratings: 'Ratings & Reviews',
      noRatings: 'No ratings yet',
      writeReview: 'Write a review',
      verifiedInstall: 'Verified install',
      helpful: 'Helpful',
      report: 'Report',
      developerInfo: 'Developer info',
      updated: 'Last updated',
      version: 'Version',
      size: 'Size',
      similar: 'Similar apps',
    },
    review: {
      queueTitle: 'App Review Queue',
      approve: 'Approve',
      reject: 'Reject',
      requestChanges: 'Request Changes',
      notes: 'Review notes',
    },
    empty: {
      title: 'No apps match your search.',
      subtitle: 'Try a caring keyword or reset the filters.',
    },
    storePromise: 'Ad-free · Privacy-first',
    footer: {
      line1: 'Built by <strong>Umut Candan</strong>. No ads, no trackers, no games with your data.',
      line2: 'Open source · Hosted on <a href="https://pages.github.com/" target="_blank" rel="noreferrer">GitHub Pages</a>.',
      privacy: 'Privacy',
      terms: 'Terms',
      developers: 'Developers',
    },
    featuredTitle: 'Featured',
    allAppsTitle: 'All apps',
    theme: { light: 'Light mode', dark: 'Dark mode' },
  },
  tr: {
    heroKicker: 'Mahremiyet dostu · Kalbe iyi gelen',
    heroTitle: 'AdilStore · Saygılı uygulamalar',
    heroSubtitle: 'Zamanına, mahremiyetine ve onuruna saygı duyan; özenle yapılmış araçlar, oyunlar ve manevi yoldaşlardan oluşan sıcak bir koleksiyon.',
    heroNote: 'Niyetle yapılmış, aile dostu ve yumuşak deneyimler.',
    heroAppTagline: "Bugünün yıldızı: her gün değişen öneri",
    categories: {
      all: 'Tüm uygulamalar',
      spiritual: 'Maneviyat ve ihsan',
      wellness: 'İyilik hali ve zihin',
      learning: 'Öğrenme ve tefekkür',
      games: 'Oyun ve eğlence',
      tools: 'Araçlar ve yardımcılar',
      environment: 'Çevre ve hassasiyet',
      'self-assessment': 'Öz değerlendirme',
    },
    searchPlaceholder: 'Uygulama, etiket veya umut ara…',
    results: { single: 'uygulama', plural: 'uygulama' },
    metrics: {
      apps: 'Aktif uygulama',
      privacy: 'Mahremiyet ve nezaket',
      privacyValue: 'Reklam yok · Takipçi yok',
      platforms: 'Platformlar',
      platformsValue: 'Web ve Android',
    },
    buttons: {
      open: 'Uygulamayı aç',
      openPlay: "Google Play'de aç",
      live: 'Canlı önizleme',
      hide: 'Önizlemeyi gizle',
      unavailable: 'Önizleme kullanılamıyor',
      signIn: 'Giriş yap',
      signUp: 'Kayıt ol',
      signOut: 'Çıkış yap',
      submit: 'Gönder',
      cancel: 'İptal',
      save: 'Kaydet',
      back: 'Geri',
      viewAll: 'Tümünü gör',
      share: 'Paylaş',
      install: 'Yükle',
    },
    nav: {
      home: 'Ana sayfa',
      devPortal: 'Geliştirici Portalı',
      submitApp: 'Uygulama Gönder',
      myApps: 'Uygulamalarım',
      reviewQueue: 'İnceleme Kuyruğu',
      profile: 'Profil',
    },
    auth: {
      loginTitle: "AdilStore'a giriş yap",
      registerTitle: 'Hesabını oluştur',
      email: 'E-posta',
      password: 'Şifre',
      displayName: 'Görünen ad',
      forgotPassword: 'Şifreni mi unuttun?',
      noAccount: 'Hesabın yok mu?',
      hasAccount: 'Zaten hesabın var mı?',
      orContinueWith: 'Veya şununla devam et',
    },
    developer: {
      portalTitle: 'Geliştirici Portalı',
      applyTitle: 'Geliştirici Ol',
      applySubtitle: 'Geliştirici profilini incelenmek üzere gönder. Her geliştiriciyi elle doğruluyoruz.',
      dashboardTitle: 'Kontrol Paneli',
      website: 'Web sitesi',
      description: 'Hakkında / kuruluşun hakkında',
      pending: 'Geliştirici başvurun inceleniyor.',
      rejected: 'Geliştirici başvurun onaylanmadı.',
      submitApp: 'Yeni Uygulama Gönder',
      editApp: 'Uygulamayı Düzenle',
      installs: 'Yüklemeler',
      ratings: 'Ort. Puan',
      versions: 'Sürümler',
      status: 'Durum',
    },
    submission: {
      title: 'Uygulamanı gönder',
      subtitle: 'Saygılı, reklamsız ve mahremiyet dostu bir uygulamayı bizimle paylaş. Tüm başvuruları tek tek inceliyoruz.',
      appName: 'Uygulama adı',
      appUrl: 'Uygulama adresi (URL)',
      category: 'Kategori',
      contactEmail: 'İletişim e-posta',
      description: 'Kısa açıklama (AdilStore için neden uygun?)',
      descriptionEn: 'Açıklama (İngilizce)',
      descriptionTr: 'Açıklama (Türkçe)',
      extraNotes: 'Ek notlar (açık kaynak linkleri, lisanslar vb.)',
      icon: 'Uygulama ikonu',
      iconHint: 'En fazla ~1MB, kare görseller en iyi sonucu verir.',
      screenshots: 'Ekran görüntüleri (en fazla 5)',
      tags: 'Etiketler (virgülle ayrılmış)',
      platforms: 'Platformlar',
      privacyUrl: 'Gizlilik politikası URL',
      sourceUrl: 'Kaynak kodu URL (açık kaynaksa)',
      version: 'Sürüm',
      success: 'Teşekkürler! Uygulama başvurunuz bize ulaştı. Yayınlanmadan önce elle inceleyeceğiz.',
      error: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      sending: 'Gönderiliyor…',
    },
    appDetail: {
      aboutApp: 'Bu uygulama hakkında',
      ratings: 'Puanlar ve Yorumlar',
      noRatings: 'Henüz puan yok',
      writeReview: 'Yorum yaz',
      verifiedInstall: 'Doğrulanmış yükleme',
      helpful: 'Faydalı',
      report: 'Bildir',
      developerInfo: 'Geliştirici bilgisi',
      updated: 'Son güncelleme',
      version: 'Sürüm',
      size: 'Boyut',
      similar: 'Benzer uygulamalar',
    },
    review: {
      queueTitle: 'Uygulama İnceleme Kuyruğu',
      approve: 'Onayla',
      reject: 'Reddet',
      requestChanges: 'Değişiklik İste',
      notes: 'İnceleme notları',
    },
    empty: {
      title: 'Aramanızla eşleşen uygulama yok.',
      subtitle: 'Daha yumuşak bir anahtar kelime deneyin veya filtreleri sıfırlayın.',
    },
    storePromise: 'Reklamsız · Mahremiyet öncelikli',
    footer: {
      line1: 'Tüm uygulamalar <strong>Umut Candan</strong> tarafından. Reklam yok, takipçi yok, verinle oyun yok.',
      line2: 'Açık kaynak · <a href="https://pages.github.com/" target="_blank" rel="noreferrer">GitHub Pages</a> üzerinde barındırılır.',
      privacy: 'Gizlilik',
      terms: 'Şartlar',
      developers: 'Geliştiriciler',
    },
    featuredTitle: 'Öne çıkanlar',
    allAppsTitle: 'Tüm uygulamalar',
    theme: { light: 'Açık mod', dark: 'Koyu mod' },
  },
};

export function t(path) {
  const { lang } = getState();
  const keys = path.split('.');
  let result = keys.reduce((obj, key) => (obj ? obj[key] : undefined), translations[lang]);
  if (result === undefined) {
    result = keys.reduce((obj, key) => (obj ? obj[key] : undefined), translations.en);
  }
  return result ?? path;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  setState({ lang });
  localStorage.setItem('adilstore-lang', lang);
  document.documentElement.lang = lang;
}

export function initLang() {
  const stored = localStorage.getItem('adilstore-lang');
  const lang = stored && translations[stored] ? stored : 'en';
  setState({ lang });
  document.documentElement.lang = lang;
}

export function getLocalizedText(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const { lang } = getState();
    return value[lang] || value.en || Object.values(value)[0] || '';
  }
  return value || '';
}

export function getLocalizedList(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const { lang } = getState();
    return value[lang] || value.en || [];
  }
  return [];
}

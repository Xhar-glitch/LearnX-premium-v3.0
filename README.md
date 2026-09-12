# LearnX Premium — Learning OS

GitHub Pages-ready, mobile-first learning dashboard.

## Struktur wajib

```text
learnx-premium/
├── index.html
├── styles.css
├── app.js
├── icon-system.js
├── README.md
└── assets/
    ├── intro.mp4
    ├── intro-poster.jpg
    ├── dashboard-base.mp4
    ├── dashboard-base-poster.jpg
    └── fingerprint-reference.png
```

## Urutan aplikasi

1. Simulasi fingerprint premium.
2. Intro memakai video 9:16 `assets/intro.mp4`.
3. Video intro mengulang otomatis setelah selesai; tombol **Berikutnya** muncul setelah putaran pertama selesai.
4. Dashboard Base memakai video anime rambut pirang `assets/dashboard-base.mp4`.
5. Sambutan "Hello everyone, welcome to LearnX" diputar sebelum audio video Dashboard untuk menghindari benturan suara.
6. Kurikulum berada tepat di bawah video Dashboard dan bisa digeser horizontal di ponsel.

## GitHub Pages

Upload **isi folder `learnx-premium`** ke root repository. Pastikan folder `assets` tidak dipecah dan nama file tidak diubah.

Lalu: Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

## Catatan

Fingerprint hanya simulasi antarmuka; tidak mengakses sensor biometrik HP.

Tes IQ adalah latihan penalaran dengan kunci jawaban deterministik. Skor aplikasi bukan diagnosis atau ukuran IQ klinis.

Materi psikologi difokuskan pada komunikasi, critical thinking, kecerdasan sosial, dan pertahanan dari manipulasi; bukan instruksi untuk mengeksploitasi atau mengendalikan orang.

# SENTINEL Karol — budowanie APK na GitHub

Ten katalog jest kompletnym projektem potrzebnym do zbudowania instalatora Android `SENTINEL-Karol.apk` przez GitHub Actions. Nie wymaga Android Studio.

## Pierwsze zbudowanie APK

1. Utwórz nowe, puste repozytorium na GitHubie.
2. Rozpakuj ZIP i wgraj do głównego katalogu repozytorium **całą zawartość** folderu `sentinel-karol-apk`. Pliki `package.json`, `MainActivity.java`, `ScanActivity.java`, `ScannerPlugin.java` oraz foldery `www` i `.github` muszą znajdować się bezpośrednio w katalogu głównym repozytorium.
3. Zatwierdź pliki na gałęzi `main`.
4. Otwórz na GitHubie kartę **Actions**.
5. Wybierz workflow **Build SENTINEL APK**.
6. Kliknij **Run workflow**, a następnie ponownie **Run workflow**. Workflow uruchamia się również automatycznie po każdym `push` do `main` lub `master`.
7. Po zielonym zakończeniu otwórz wykonany workflow.
8. W sekcji **Artifacts** pobierz `SENTINEL-Karol-APK`.
9. Rozpakuj artefakt. W środku znajduje się `SENTINEL-Karol.apk`.

Jeżeli GitHub zapyta o zezwolenie na uruchamianie workflow, wybierz **I understand my workflows, go ahead and enable them**.

## Podpis aplikacji

Bez dodatkowej konfiguracji workflow wygeneruje testowy klucz i poprawnie zbuduje instalowalny APK. Klucz testowy jest tworzony od nowa przy każdym buildzie, dlatego kolejna wersja może wymagać odinstalowania poprzedniej aplikacji.

Aby każdą kolejną wersję instalować jako aktualizację bez usuwania danych, skonfiguruj jeden stały klucz:

```bash
keytool -genkeypair -v -keystore sentinel.keystore -alias sentinel -keyalg RSA -keysize 2048 -validity 10000
```

Następnie w repozytorium GitHub otwórz **Settings → Secrets and variables → Actions** i dodaj:

- `KEYSTORE_BASE64` — plik `sentinel.keystore` zakodowany w Base64,
- `KEYSTORE_PASSWORD` — hasło magazynu,
- `KEY_ALIAS` — `sentinel`,
- `KEY_PASSWORD` — hasło klucza.

PowerShell — kodowanie klucza do Base64:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("sentinel.keystore")) | Set-Content keystore.txt
```

Zachowaj `sentinel.keystore` poza repozytorium. Utrata klucza uniemożliwi wydawanie aktualizacji podpisanych tak samo.

## Połączenie z serwerem Sentinel

Po instalacji aplikacja mobilna musi łączyć się z komputerem, na którym działa `node server.js` z pełnego projektu Sentinel Karol. Telefon i komputer powinny znajdować się w tej samej sieci. W aplikacji ustaw adres w formacie:

```text
http://192.168.1.100:3000
```

Zastąp adres przykładowy adresem IPv4 komputera. Zapora Windows musi zezwalać na połączenia do portu 3000.

Historia raportów DDMS Ratio, W/H Inspection i Cleanily OQC jest zapisywana przez serwer w folderach `DDMS`, `WH` i `CLEANILY` wewnątrz aktualnej lokalizacji wybranej przyciskiem **Folder**. Może to być również udział sieciowy, np. `\\106.116.82.74\sepm\CS Team\cs\OQC\Pralki\Opcje\Sentinel`. W każdym module plik stanu trafia do `json`, a wygenerowany Excel, PPTX, HTML, PDF lub JPG do `raport`. Wymaga to serwera z pełnej, zaktualizowanej paczki Sentinel Karol.

## Aparat i skaner w telefonie

- DDMS Ratio korzysta w APK z natywnego skanera kodów SENTINEL.
- Przyciski zdjęć w W/H Inspection i Cleanily OQC otwierają bezpośrednio aparat telefonu; w przeglądarce pozostaje standardowy wybór zdjęcia.
- Przy pierwszym użyciu Android poprosi o dostęp do aparatu — należy wybrać **Zezwól podczas używania aplikacji**.
- Układ DDMS jest zmniejszany na krótkich ekranach, aby dolny pasek przycisków pozostawał widoczny.

## Zawartość projektu

- `.github/workflows/build-apk.yml` — automatyczny build na GitHubie,
- `www/` — aplikacja Sentinel Karol wraz z modułami DDMS, W/H i Cleanily,
- `assets/sentinel-icon.png` — zaakceptowana ikona źródłowa 1024 × 1024 px,
- `assets/android-icons/` — gotowe ikony klasyczne i adaptacyjne Androida,
- `MainActivity.java`, `ScanActivity.java`, `ScannerPlugin.java` — natywny skaner kodów i udostępnianie plików; kopie znajdują się też w `native/`,
- `patch-android.js` — uprawnienia Android, zależności, podpis i wersjonowanie,
- `verify-apk-project.js` — kontrola kompletności uruchamiana przez GitHub Actions,
- `capacitor.config.json` — konfiguracja aplikacji,
- `package.json` — zależności Capacitora.

## Ważne

- Folder `android` powstaje automatycznie podczas workflow i nie należy go dodawać do repozytorium.
- Plik APK jest wersją wewnętrzną/debug, przeznaczoną do instalacji ręcznej.
- Sam APK nie uruchamia serwera Node; synchronizacja działa, gdy komputer z pełnym Sentinelem ma uruchomiony serwer.

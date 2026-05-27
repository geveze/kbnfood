@echo off
color 0A
echo ==============================================================
echo KEBAN FOOD PERFORMANS - OTOMATIK YAYINLAMA SIHIRBAZI (RAILWAY)
echo ==============================================================
echo.
echo Bu sihirbaz projenizi 7/24 ucretsiz ve kalici olarak
echo Railway.app uzerinde yayinlayacaktir.
echo.
echo Islemler sirasinda tarayiciniz acilacak, 
echo lutfen "Login with GitHub" diyerek giris yapin.
echo.
echo Hazirsaniz baslamak icin bir tusa basin...
pause >nul

echo.
echo [1/3] Railway sistemi indiriliyor...
call npm install -g @railway/cli

echo.
echo [2/3] Tarayicida giris yapmaniz bekleniyor...
echo Lutfen acilan sekmede giris yapin ve buraya donun!
call railway login

echo.
echo [3/3] Projeniz Railway sistemine olusturuluyor...
echo (Cikan sorularda klavyenizden ENTER tusuna basabilirsiniz)
call railway init

echo.
echo Projeniz buluta yukleniyor ve baslatiliyor...
echo Bu islem 2-3 dakika surebilir. Lutfen bekleyin...
call railway up

echo.
echo ==============================================================
echo TEBRIKLER! YUKLEME TAMAMLANDI!
echo ==============================================================
echo Projenizin durumunu ve canli linkini gormek icin:
echo https://railway.app/dashboard
echo adresine gidebilirsiniz.
echo.
echo AYRICA UNUTMAYIN: Railway panelinizden uygulamanizin icine girip
echo "Variables" sekmesine "DATABASE_URL" degiskenini eklemelisiniz.
echo (Bu deger projedeki .env.example dosyasinda yazmaktadir)
echo.
pause

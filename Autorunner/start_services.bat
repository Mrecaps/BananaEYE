@echo off
cd /d "C:\Users\Recap\OneDrive\Documents\Banana_Project"

:: Launch Log-to-CSV silently
start "" "C:\Users\Recap\AppData\Local\Programs\Python\Python310\pythonw.exe" "C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\Auto_convert.pyw"

timeout /t 30 /nobreak >nul

:: Launch Geotagger silently
start "" "C:\Users\Recap\AppData\Local\Programs\Python\Python310\pythonw.exe" "C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Auto_geotag.pyw"

exit

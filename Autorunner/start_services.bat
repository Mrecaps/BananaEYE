@echo off
title Banana Project Automation
cd /d "C:\Users\Recap\OneDrive\Documents\Banana_Project"

echo [STARTUP] Launching Log-to-CSV service...
start "" python "C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\Auto_convert.pyw"

echo Waiting 20 seconds before launching Geotagger...
timeout /t 40 /nobreak >nul

echo [STARTUP] Launching Geotag service...
start "" python "C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Auto_geotag.pyw"

echo [DONE] Both services started successfully.
exit

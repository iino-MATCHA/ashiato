@echo off
cd /d "%~dp0.."
npx expo start --web --port %PORT%

@echo off
REM Testing script for Stellar Arbitrage contracts

echo Running unit tests...
cargo test

if %errorlevel% equ 0 (
    echo All tests passed!
) else (
    echo Some tests failed. Please check the output above.
    exit /b 1
)

echo Running integration tests...
cargo test --lib

if %errorlevel% equ 0 (
    echo All integration tests passed!
) else (
    echo Some integration tests failed. Please check the output above.
    exit /b 1
)
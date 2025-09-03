#!/bin/bash

# Testing script for Stellar Arbitrage contracts

echo "Running unit tests..."
cargo test

if [ $? -eq 0 ]; then
    echo "All tests passed!"
else
    echo "Some tests failed. Please check the output above."
    exit 1
fi

echo "Running integration tests..."
cargo test --lib

if [ $? -eq 0 ]; then
    echo "All integration tests passed!"
else
    echo "Some integration tests failed. Please check the output above."
    exit 1
fi
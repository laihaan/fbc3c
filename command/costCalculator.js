// costCalculator.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'costCalculator',
    execute: (durationMinutes) => {
        // Tính tiền dựa trên số phút
        const baseRate = 10000; // 10000 VND cho 30 phút
        const duration = Math.ceil(durationMinutes / 30);
        return baseRate * duration;
    }
};

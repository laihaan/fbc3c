const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Hàm lắc xí ngầu và trả về kết quả
const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1;
};

// Hàm chuyển đổi định dạng số tiền với ký hiệu
const parseBetAmount = (amount) => {
    const match = amount.match(/^(\d+)([kmb])$/i);
    if (match) {
        const value = parseFloat(match[1]);
        switch (match[2].toLowerCase()) {
            case 'k': return value * 1000;
            case 'm': return value * 1000000;
            case 'b': return value * 1000000000;
        }
    }
    return parseFloat(amount);
};

// Hàm thực thi lệnh tài xỉu
module.exports = {
    name: 'tx',
    execute: async (message, api) => {
        const uid = message.senderID;
        const args = message.body.split(' ').slice(1); // Lấy các tham số từ lệnh
        const cooldownTime = 30000; // Thời gian chờ giữa các lệnh (30 giây)
        const now = Date.now();

        // Đọc dữ liệu từ file JSON
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        let user = data.find(user => user.senderID === uid);

        if (user) {
            // Kiểm tra thời gian chờ
            if (user.lastTx && now - user.lastTx < cooldownTime) {
                return api.sendMessage('⏳ Bạn cần chờ thêm 30 giây trước khi chơi tx lần nữa.', message.threadID);
            }

            // Cập nhật thời gian chơi
            user.lastTx = now;
        }

        // Kiểm tra định dạng lệnh
        if (args.length !== 2) {
            return api.sendMessage('🚫 Lệnh không hợp lệ. Vui lòng sử dụng: !tx [t/x] [số tiền/all].', message.threadID);
        }

        const betChoice = args[0].toLowerCase();
        let betAmount = args[1].toLowerCase() === 'all' ? user.money : parseBetAmount(args[1]);

        // Giới hạn số tiền cược tối đa là 500,000
        if (betAmount > 500000) {
            betAmount = 500000;
        }

        // Kiểm tra lựa chọn cược và số tiền cược
        if (!['t', 'x'].includes(betChoice) || isNaN(betAmount) || betAmount <= 0) {
            return api.sendMessage('🚫 Lệnh không hợp lệ. Vui lòng sử dụng: !tx [t/x] [số tiền/all].', message.threadID);
        }

        if (!user) {
            return api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }

        if (user.money < betAmount) {
            return api.sendMessage('🚫 Số dư của bạn không đủ để cược.', message.threadID);
        }

        // Lắc 3 xí ngầu
        const dice1 = rollDice();
        const dice2 = rollDice();
        const dice3 = rollDice();
        const total = dice1 + dice2 + dice3;

        // Xác định kết quả tài/xỉu
        const result = total > 10 ? 't' : 'x';
        const resultText = result.toUpperCase();

        let messageText = `🎲: ${dice1}\n🎲: ${dice2}\n🎲: ${dice3}\n`;

        if (result === betChoice) {
            // Người dùng thắng
            const winnings = Math.round(betAmount * 2 * 0.998); // Gấp 2 số tiền cược và trừ 0.2% phí, làm tròn số
            user.money = Math.round(user.money + winnings); // Cộng tiền thắng vào balance và làm tròn số
            messageText += `${resultText} - BẠN THẮNG ${winnings.toLocaleString()} VND!`;
        } else {
            // Người dùng thua
            user.money = Math.round(user.money - betAmount); // Trừ tiền cược từ balance và làm tròn số
            messageText += `${resultText} - BẠN THUA ${betAmount.toLocaleString()} VND.`;
        }

        // Cập nhật dữ liệu vào file
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

        // Gửi thông báo kết quả
        api.sendMessage(messageText, message.threadID);
    }
};

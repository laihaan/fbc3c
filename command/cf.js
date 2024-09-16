const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

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

// Hàm thực thi lệnh cf (coinflip)
module.exports = {
    name: 'cf',
    execute: async (message, api) => {
        const uid = message.senderID;
        const args = message.body.split(' ').slice(1); // Lấy các tham số từ lệnh

        // Đọc dữ liệu từ file JSON
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        let user = data.find(user => user.senderID === uid);

        if (!user) {
            return api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }

        // Kiểm tra định dạng lệnh
        if (args.length !== 2) {
            return api.sendMessage('🚫 Lệnh không hợp lệ. Vui lòng sử dụng: !cf [h/t] [số tiền/all].', message.threadID);
        }

        const betChoice = args[0].toLowerCase();
        let betAmount = args[1].toLowerCase() === 'all' ? user.money : parseBetAmount(args[1]);

        // Giới hạn số tiền cược tối đa là 500,000
        if (betAmount > 500000) {
            betAmount = 500000;
        }

        // Chuyển đổi lựa chọn rút gọn thành đầy đủ
        const choices = {
            'h': 'heads',
            't': 'tails'
        };
        const fullChoice = choices[betChoice];

        // Kiểm tra lựa chọn cược và số tiền cược
        if (!fullChoice || isNaN(betAmount) || betAmount <= 0) {
            return api.sendMessage('🚫 Lệnh không hợp lệ. Vui lòng sử dụng: !cf [h/t] [số tiền/all].', message.threadID);
        }

        if (user.money < betAmount) {
            return api.sendMessage('🚫 Số dư của bạn không đủ để cược.', message.threadID);
        }

        // Thực hiện lật đồng xu
        const result = Math.random() < 0.5 ? 'heads' : 'tails';

        if (result === fullChoice) {
            // Người dùng thắng
            const winnings = betAmount * 2; // Gấp đôi số tiền cược
            user.money += winnings;
            api.sendMessage(`🎉 Chúc mừng! Bạn đã lật đồng xu trúng ${result} và thắng ${winnings.toLocaleString()} VND.`, message.threadID);
        } else {
            // Người dùng thua
            user.money -= betAmount;
            api.sendMessage(`😞 Rất tiếc! Bạn đã lật đồng xu trúng ${result} và thua ${betAmount.toLocaleString()} VND.`, message.threadID);
        }

        // Cập nhật dữ liệu vào file
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    }
};

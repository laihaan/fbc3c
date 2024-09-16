const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Giới hạn thời gian mua
const MAX_PURCHASE_TIME = 120 * 60 * 1000; // 120 phút
const COST_PER_MINUTE = 50000; // Giá tiền mỗi phút

// Hàm thực thi lệnh mua thời gian sử dụng hunt9
module.exports = {
    name: 'hunt9buy',
    execute: async (message, api, args) => {
        const uid = message.senderID;
        const minutes = parseInt(args[0], 10);

        if (isNaN(minutes) || minutes <= 0) {
            api.sendMessage('🚫 Vui lòng nhập số phút hợp lệ để mua thời gian sử dụng.', message.threadID);
            return;
        }

        const purchaseTime = minutes * 60 * 1000;
        const totalCost = minutes * COST_PER_MINUTE;

        if (purchaseTime > MAX_PURCHASE_TIME) {
            api.sendMessage('🚫 Bạn không thể mua quá 120 phút.', message.threadID);
            return;
        }

        try {
            // Đọc dữ liệu từ file JSON
            const dataFile = await fs.readFile(dataFilePath, 'utf8');
            let data = JSON.parse(dataFile);

            // Tìm thông tin người dùng
            let user = data.find(user => user.senderID === uid);

            if (!user) {
                api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
                return;
            }

            // Kiểm tra số tiền có đủ để mua thời gian không
            if (user.money < totalCost) {
                api.sendMessage('💸 Bạn không đủ tiền để mua thời gian sử dụng lệnh săn bắn 9 con.', message.threadID);
                return;
            }

            // Trừ tiền người dùng
            user.money -= totalCost;

            // Cập nhật thời gian sử dụng hunt9
            const now = Date.now();
            user.hunt9Timeout = (user.hunt9Timeout || now) + purchaseTime;

            // Lưu dữ liệu vào file
            await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

            // Gửi thông báo kết quả mua
            api.sendMessage(`🎉 Bạn đã mua thêm ${minutes} phút thời gian sử dụng lệnh săn bắn 9 con với giá ${totalCost} tiền!`, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh mua thời gian:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh mua thời gian. Vui lòng thử lại sau.', message.threadID);
        }
    }
};

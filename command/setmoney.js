const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

module.exports = {
    name: 'setmoney',
    execute: async (message, api) => {
        const { senderID, threadID, messageID, body } = message;

        // Kiểm tra quyền hạn
        if (senderID !== '100076316652896') {
            return api.sendMessage('Bạn không có quyền sử dụng lệnh này.', threadID, messageID);
        }

        // Tách thông tin từ lệnh
        const args = body.slice(body.indexOf(' ') + 1).trim().split(' ');
        if (args.length < 2) {
            return api.sendMessage('Sử dụng: !setmoney [@tag hoặc UID] [số tiền]', threadID, messageID);
        }

        const target = args[0];
        const amount = parseInt(args[1]);

        // Đọc dữ liệu từ file JSON
        let data;
        try {
            data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        } catch (err) {
            return api.sendMessage('Lỗi khi đọc dữ liệu người dùng.', threadID, messageID);
        }

        // Cập nhật số tiền của người dùng
        const updateUserMoney = (uid, newAmount) => {
            const user = data.find(user => user.senderID === uid);
            if (user) {
                user.money = newAmount;
            } else {
                data.push({ senderID: uid, money: newAmount, xp: 0, fish: 0 });
            }
        };

        try {
            // Xử lý trường hợp là UID
            if (target.match(/^\d+$/)) {
                const uid = target;
                if (isNaN(amount)) {
                    return api.sendMessage('Số tiền không hợp lệ.', threadID, messageID);
                }
                updateUserMoney(uid, amount);
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                return api.sendMessage(`Số tiền của UID ${uid} đã được cập nhật thành ${amount.toLocaleString()} VND.`, threadID, messageID);
            }

            // Xử lý trường hợp là @tag
            const users = await api.getUserInfo().catch(err => {
                api.sendMessage('Lỗi khi lấy thông tin người dùng.', threadID, messageID);
                throw err;
            });
            const targetName = target.replace('@', '').trim(); // Xóa ký tự '@' nếu có và trim khoảng trắng

            let targetUID;
            for (const uid in users) {
                if (users[uid].name.toLowerCase() === targetName.toLowerCase()) {
                    targetUID = uid;
                    break;
                }
            }

            if (targetUID) {
                if (isNaN(amount)) {
                    return api.sendMessage('Số tiền không hợp lệ.', threadID, messageID);
                }
                updateUserMoney(targetUID, amount);
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                return api.sendMessage(`Số tiền của ${targetName} đã được cập nhật thành ${amount.toLocaleString()} VND.`, threadID, messageID);
            } else {
                return api.sendMessage('Không tìm thấy người dùng.', threadID, messageID);
            }
        } catch (err) {
            api.sendMessage('Đã xảy ra lỗi khi thực hiện lệnh.', threadID, messageID);
            console.error(err);
        }
    }
};

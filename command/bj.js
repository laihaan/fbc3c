const fs = require('fs').promises;
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/data.json');
const gamesFilePath = path.join(__dirname, '../data/games.json');

module.exports = {
    name: 'bj',
    execute: async (message, api) => {
        const [body, mentions] = [message.body, message.mentions];
        const args = body.split(' ');

        if (args.length < 3) {
            return api.sendMessage('🚫 Định dạng lệnh không hợp lệ. Sử dụng: !bj [số tiền] [@Tên người dùng]', message.threadID);
        }

        const betAmount = parseInt(args[1], 10);
        const receiverName = args.slice(2).join(' ');

        if (isNaN(betAmount) || betAmount <= 0) {
            return api.sendMessage('🚫 Số tiền cược không hợp lệ. Vui lòng nhập số tiền hợp lệ.', message.threadID);
        }


        const usersData = JSON.parse(await fs.readFile(dataFilePath, 'utf8'));
        const senderID = message.senderID;
        const receiverUID = Object.keys(mentions)[0];
        const receiverID = receiverUID || await getUIDFromName(receiverName, usersData);

        if (!receiverID) {
            return api.sendMessage('🚫 Không tìm thấy người dùng. Vui lòng kiểm tra tên người dùng và thử lại.', message.threadID);
        }


        const sender = usersData.find(user => user.senderID === senderID);
        const receiver = usersData.find(user => user.senderID === receiverID);

        if (!sender || !receiver || sender.money < betAmount || receiver.money < betAmount) {
            return api.sendMessage('🚫 Một hoặc cả hai người chơi không đủ tiền để cược. Vui lòng kiểm tra số tiền của bạn và thử lại.', message.threadID);
        }


        const gamesData = JSON.parse(await fs.readFile(gamesFilePath, 'utf8'));
        gamesData.push({
            senderID,
            receiverID,
            betAmount,
            status: 'pending'
        });

        await fs.writeFile(gamesFilePath, JSON.stringify(gamesData, null, 2));
        api.sendMessage(`🎲 Bạn đã gửi lời mời chơi bài đến @${receiverName}. Chờ họ xác nhận!`, message.threadID);
    }
};

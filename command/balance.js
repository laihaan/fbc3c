const fs = require('fs');
const path = require('path');


const readData = () => {
    const dataFilePath = path.join(__dirname, '../data/data.json');
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([]));
    }
    const rawData = fs.readFileSync(dataFilePath);
    return JSON.parse(rawData);
};

module.exports = {
    name: 'balance',
    execute: (message, api) => {
        const uid = message.senderID;
        const data = readData();


        const user = data.find(user => user.senderID === uid);

        if (user) {

            api.sendMessage(`💰 **Số dư của bạn**: ${user.money || 0} VND`, message.threadID);
        } else {

            api.sendMessage('🚫 Bạn chưa được đăng ký. Vui lòng sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }
    }
};

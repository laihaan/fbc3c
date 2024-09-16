const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng và vòng quay
const dataFilePath = path.join(__dirname, '../data/data.json');
const wheelFilePath = path.join(__dirname, '../data/wheel.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');

// Hàm thực thi lệnh quay vòng quay may mắn
module.exports = {
    name: 'spinwheel',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ các file JSON
            const [dataFile, wheelFile, inventoryFile] = await Promise.all([
                fs.readFile(dataFilePath, 'utf8'),
                fs.readFile(wheelFilePath, 'utf8'),
                fs.readFile(inventoryFilePath, 'utf8')
            ]);

            // Xử lý lỗi JSON
            let data, wheel, inventory;
            try {
                data = JSON.parse(dataFile);
                wheel = JSON.parse(wheelFile);
                inventory = JSON.parse(inventoryFile);
            } catch (parseError) {
                console.error('Lỗi phân tích JSON:', parseError);
                api.sendMessage('🚨 Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng kiểm tra dữ liệu và thử lại sau.', message.threadID);
                return;
            }

            // Tìm thông tin người dùng
            let user = data.find(user => user.senderID === uid);
            if (!user) {
                api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
                return;
            }

            // Kiểm tra số tiền của người dùng
            if ((user.money || 0) < 5000) {
                api.sendMessage('🚫 Bạn không đủ tiền để quay vòng quay. Bạn cần ít nhất 5000 VND.', message.threadID);
                return;
            }

            // Trừ tiền và thực hiện quay vòng quay
            user.money -= 5000;

            // Chọn một phần thưởng ngẫu nhiên dựa trên xác suất
            const segment = getRandomSegment(wheel);

            let messageText;
            if (segment.name === 'Không nhận được gì') {
                messageText = '🚫 Rất tiếc, bạn không nhận được gì.';
            } else if (segment.name === 'Quay lại') {
                messageText = '🔄 Bạn được quay lại vòng quay mà không mất thêm tiền.';
                user.money += 5000; // Hoàn lại tiền để người dùng có thể quay lại
            } else if (segment.name === 'Tiền mặt') {
                messageText = `💵 Chúc mừng! Bạn nhận được ${segment.value.toFixed(2)} VND.`;
                user.money += segment.value;
            } else if (segment.name === 'XP') {
                messageText = `🎉 Bạn nhận được ${segment.value} XP!`;
                user.xp = (user.xp || 0) + segment.value;
            } else if (segment.name === 'Khoáng sản') {
                messageText = `⛏️ Bạn nhận được khoáng sản: ${segment.value}.`;
                // Thêm khoáng sản vào kho
                let userInventory = inventory.find(item => item.senderID === uid);
                if (!userInventory) {
                    userInventory = { senderID: uid, items: {} };
                    inventory.push(userInventory);
                }
                userInventory.items[segment.value] = (userInventory.items[segment.value] || 0) + 1;
            } else if (segment.name === 'Con vật') {
                messageText = `🦁 Bạn nhận được con vật: ${segment.value}.`;
                // Thêm con vật vào kho
                let userInventory = inventory.find(item => item.senderID === uid);
                if (!userInventory) {
                    userInventory = { senderID: uid, items: {} };
                    inventory.push(userInventory);
                }
                userInventory.items[segment.value] = (userInventory.items[segment.value] || 0) + 1;
            }

            // Lưu dữ liệu vào file
            await Promise.all([
                fs.writeFile(dataFilePath, JSON.stringify(data, null, 2)),
                fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2))
            ]);

            // Gửi thông báo kết quả quay vòng quay
            api.sendMessage(messageText, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh quay vòng quay:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh quay vòng quay. Vui lòng thử lại sau.', message.threadID);
        }
    }
};

// Hàm chọn một phần thưởng ngẫu nhiên dựa trên xác suất
const getRandomSegment = (wheel) => {
    const totalProbability = wheel.segments.reduce((sum, segment) => sum + segment.probability, 0);
    let random = Math.random() * totalProbability;
    for (const segment of wheel.segments) {
        random -= segment.probability;
        if (random <= 0) {
            return segment;
        }
    }
};

const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng, kho và khoáng sản
const dataFilePath = path.join(__dirname, '../data/data.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const mineralsFilePath = path.join(__dirname, '../data/minerals.json');

// Thời gian chờ của lệnh mine (15 phút)
const COOLDOWN_TIME = 15 * 60 * 1000; // 15 phút

// Hàm thực thi lệnh khai thác khoáng sản
module.exports = {
    name: 'mine',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ các file JSON
            const [dataFile, inventoryFile, mineralsFile] = await Promise.all([
                fs.readFile(dataFilePath, 'utf8'),
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(mineralsFilePath, 'utf8')
            ]);

            // Xử lý lỗi JSON
            let data, inventory, minerals;
            try {
                data = JSON.parse(dataFile);
                inventory = JSON.parse(inventoryFile);
                minerals = JSON.parse(mineralsFile);
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

            // Kiểm tra thời gian chờ giữa các lệnh
            const now = Date.now();
            if (user.lastMineTime && (now - user.lastMineTime < COOLDOWN_TIME)) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - user.lastMineTime)) / 1000);
                api.sendMessage(`⏳ Bạn phải chờ thêm ${remainingTime} giây trước khi thực hiện lệnh khai thác tiếp theo.`, message.threadID);
                return;
            }

            // Cập nhật thời gian thực hiện lệnh
            user.lastMineTime = now;

            // Chọn ngẫu nhiên số lượng khoáng sản từ 1 đến 3
            const numMinerals = Math.floor(Math.random() * 3) + 1;
            const selectedMinerals = [];

            while (selectedMinerals.length < numMinerals) {
                const randomIndex = Math.floor(Math.random() * minerals.length);
                const selectedMineral = minerals[randomIndex];
                if (!selectedMinerals.includes(selectedMineral)) {
                    selectedMinerals.push(selectedMineral);
                }
            }

            // Cập nhật kho
            let userInventory = inventory.find(item => item.senderID === uid);
            if (!userInventory) {
                userInventory = { senderID: uid, items: {} };
                inventory.push(userInventory);
            }

            selectedMinerals.forEach(mineral => {
                const mineralName = mineral.name;
                userInventory.items[mineralName] = (userInventory.items[mineralName] || 0) + 1;
            });

            // Lưu dữ liệu vào file
            await Promise.all([
                fs.writeFile(dataFilePath, JSON.stringify(data, null, 2)),
                fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2))
            ]);

            // Gửi thông báo kết quả khai thác
            const mineralNames = selectedMinerals.map(m => m.name).join(', ');
            api.sendMessage(`⛏️ Bạn đã khai thác được các khoáng sản: ${mineralNames}!`, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh khai thác:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh khai thác. Vui lòng thử lại sau.', message.threadID);
        }
    }
};

const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến các file JSON
const dataFilePath = path.join(__dirname, '../data/data.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const huntbotFilePath = path.join(__dirname, '../data/huntbot.json');
const animalsFilePath = path.join(__dirname, '../data/animals.json');

// Hàm thực thi lệnh săn bắn
module.exports = {
    name: 'hb',
    execute: async (message, api) => {
        const uid = message.senderID;
        const args = message.body.split(' ');
        const minutes = parseInt(args[1], 10) || 0; // Thời gian săn bắn từ lệnh

        if (isNaN(minutes) || minutes <= 0 || minutes > 30) {
            api.sendMessage('⛔ Thời gian không hợp lệ. Vui lòng nhập số phút từ 1 đến 30.', message.threadID);
            return;
        }

        try {
            // Đọc dữ liệu từ các file JSON
            const [dataFile, inventoryFile, huntbotFile, animalsFile] = await Promise.all([
                fs.readFile(dataFilePath, 'utf8'),
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(huntbotFilePath, 'utf8'),
                fs.readFile(animalsFilePath, 'utf8')
            ]);

            let data, inventory, huntbot, animals;
            try {
                data = JSON.parse(dataFile);
                inventory = JSON.parse(inventoryFile);
                huntbot = JSON.parse(huntbotFile);
                animals = JSON.parse(animalsFile);
            } catch (parseError) {
                console.error('Lỗi phân tích JSON:', parseError);
                api.sendMessage('🚨 Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng kiểm tra dữ liệu và thử lại sau.', message.threadID);
                return;
            }

            // Tìm thông tin người dùng trong data
            let user = data.find(user => user.senderID === uid);

            if (!user) {
                api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
                return;
            }

            // Tìm hoặc tạo thông tin người dùng trong huntbot.json
            let userHuntbot = huntbot.find(user => user.uid === uid);

            if (!userHuntbot) {
                // Thêm thông tin người dùng mới với giá trị mặc định
                userHuntbot = {
                    uid: uid,
                    efficiency: {
                        level: 0,
                        value: 1,
                        upgradeCost: 0,
                        remainingEssence: 0
                    },
                    gain: {
                        level: 0,
                        value: 5,
                        upgradeCost: 0
                    },
                    duration: {
                        level: 0,
                        value: 30,
                        upgradeCost: 0
                    },
                    essence: 0
                };
                huntbot.push(userHuntbot);
                await fs.writeFile(huntbotFilePath, JSON.stringify(huntbot, null, 2));
            }

            // Kiểm tra thời gian chờ và cooldown
            const now = Date.now();
            const cooldownTime = 15 * 60 * 1000; // 15 phút

            if (userHuntbot.lastHunt && now - userHuntbot.lastHunt < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - (now - userHuntbot.lastHunt)) / 60000); // Thời gian còn lại tính bằng phút
                api.sendMessage(`⏳ BOT CÒN ${remainingTime} PHÚT ĐỂ HOÀN THÀNH.`, message.threadID);
                return;
            }

            // Cập nhật thời gian bắt đầu săn bắn
            userHuntbot.lastHunt = now;
            const totalMinutes = Math.min(minutes, userHuntbot.duration.value); // Số phút tối đa dựa trên duration
            const totalPets = totalMinutes * userHuntbot.efficiency.value;

            // Gửi thông báo rằng săn bắn đang được thực hiện
            api.sendMessage(`🚀 BOT ĐANG SĂN ${totalPets} CON VÀ TÍNH TOÁN ${totalMinutes} PHÚT.`, message.threadID);

            // Thiết lập thời gian chờ trước khi gửi kết quả
            setTimeout(async () => {
                try {
                    let userInventory = inventory.find(item => item.senderID === uid);
                    
                    if (!userInventory) {
                        userInventory = { senderID: uid, items: {} };
                        inventory.push(userInventory);
                    }

                    // Săn bắn và cập nhật kho
                    for (let i = 0; i < totalPets; i++) {
                        const randomAnimalIndex = Math.floor(Math.random() * animals.length);
                        const selectedAnimal = animals[randomAnimalIndex];
                        const animalName = selectedAnimal.name;

                        userInventory.items[animalName] = (userInventory.items[animalName] || 0) + 1;
                    }

                    // Tính toán tổng Essence
                    const totalEssence = totalMinutes * userHuntbot.gain.value;

                    // Lưu dữ liệu vào file
                    await Promise.all([
                        fs.writeFile(dataFilePath, JSON.stringify(data, null, 2)),
                        fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2)),
                        fs.writeFile(huntbotFilePath, JSON.stringify(huntbot, null, 2))
                    ]);

                    // Gửi thông báo kết quả săn bắn
                    api.sendMessage(`🎯 Bạn đã săn được ${totalPets} con trong ${totalMinutes} phút! Bạn nhận được ${totalEssence} Essence.`, message.threadID);
                } catch (error) {
                    console.error('Lỗi khi thực hiện săn bắn:', error);
                    api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh săn bắn. Vui lòng thử lại sau.', message.threadID);
                }
            }, totalMinutes * 60 * 1000); // Thời gian chờ tính bằng mili giây
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh săn bắn:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh săn bắn. Vui lòng thử lại sau.', message.threadID);
        }
    }
};

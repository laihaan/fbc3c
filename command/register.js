const fs = require('fs');
const path = require('path');

// Hàm lấy danh sách thành viên của cuộc trò chuyện
const getChatMembers = (threadID, api, callback) => {
    api.getThreadInfo(threadID, (error, threadInfo) => {
        if (error) {
            console.error("Lỗi khi lấy danh sách thành viên:", error);
            callback(error, []);
        } else {
            callback(null, threadInfo.participantIDs);
        }
    });
};

// Hàm lấy tên người dùng từ UID
const getNameFromUID = (uid, api, callback) => {
    api.getUserInfo(uid, (error, userInfo) => {
        if (error) {
            console.error(`Error fetching name for UID ${uid}:`, error);
            callback('Tên người dùng không thể lấy.');
        } else {
            const foundUser = Object.values(userInfo)[0];
            if (foundUser) {
                callback(foundUser.name);
            } else {
                callback('Tên người dùng không thể lấy.');
            }
        }
    });
};

// Hàm thực thi lệnh đăng ký
module.exports = {
    name: 'register',
    execute: async (message, api) => {
        const uid = message.senderID;
        const threadID = message.threadID;

        // Đọc dữ liệu từ file data.json
        const dataFilePath = path.join(__dirname, '../data/data.json');
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

        // Tìm người dùng trong dữ liệu
        const user = data.find(user => user.senderID === uid);

        if (!user) {
            // Nếu người dùng chưa có trong dữ liệu, thêm mới
            getNameFromUID(uid, api, async (userName) => {
                if (userName === 'Tên người dùng không thể lấy.') {
                    getChatMembers(threadID, api, async (error, memberIDs) => {
                        if (error) {
                            api.sendMessage('🚫 Không thể lấy thông tin người dùng.', threadID);
                        } else {
                            try {
                                api.getUserInfo(memberIDs, (error, memberInfo) => {
                                    if (error) {
                                        console.error("Lỗi khi lấy thông tin thành viên:", error);
                                        userName = 'Tên người dùng không thể lấy.';
                                    } else {
                                        const foundUser = Object.values(memberInfo).find(user => user.name && user.id === uid);
                                        if (foundUser) {
                                            userName = foundUser.name;
                                        }
                                    }

                                    const newUser = {
                                        senderID: uid,
                                        money: 0,
                                        xp: 0,
                                        fish: 0,
                                        name: userName // Lưu tên người dùng
                                    };
                                    data.push(newUser);

                                    // Lưu dữ liệu vào file
                                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

                                    api.sendMessage(`🎉 Chào mừng ${userName}! Bạn đã được thêm vào hệ thống.`, threadID);
                                });
                            } catch (error) {
                                console.error("Lỗi khi lấy thông tin người dùng:", error);
                                const newUser = {
                                    senderID: uid,
                                    money: 0,
                                    xp: 0,
                                    fish: 0,
                                    name: 'Tên người dùng không thể lấy.'
                                };
                                data.push(newUser);

                                // Lưu dữ liệu vào file
                                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

                                api.sendMessage('🚫 Không thể lấy tên người dùng. Bạn đã được thêm vào hệ thống với tên mặc định.', threadID);
                            }
                        }
                    });
                } else {
                    const newUser = {
                        senderID: uid,
                        money: 0,
                        xp: 0,
                        fish: 0,
                        name: userName // Lưu tên người dùng
                    };
                    data.push(newUser);

                    // Lưu dữ liệu vào file
                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

                    api.sendMessage(`🎉 Chào mừng ${userName}! Bạn đã được thêm vào hệ thống.`, threadID);
                }
            });
        } else {
            api.sendMessage('🚫 Bạn đã được đăng ký trước đó.', threadID);
        }
    }
};

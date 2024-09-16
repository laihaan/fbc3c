const fs = require('fs');
const path = require('path');

// Hàm lấy tên người dùng từ UID
const getNameFromUid = (uid) => {
    const dataFilePath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const user = data.find(user => user.senderID === uid);
    return user ? user.name || 'Người dùng' : 'Người dùng';
};

// Hàm lấy UID từ tên người dùng
const getUidFromName = (name) => {
    const dataFilePath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const user = data.find(user => user.name === name.trim());
    return user ? user.senderID : null;
};

// Hàm lưu dữ liệu người dùng
const saveData = (data) => {
    const dataFilePath = path.join(__dirname, '../data/data.json');
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
};

// Hàm gửi thông báo thách đấu
const sendChallengeMessage = (api, threadID, challengerID, opponentName, betAmount) => {
    api.sendMessage(
        {
            body: `📣 ${getNameFromUid(challengerID)} đã thách đấu bạn với số tiền cược ${betAmount} VND.\nBạn có chấp nhận thách đấu không?`,
            mentions: [{ tag: opponentName, id: challengerID }],
            quick_replies: [
                { content_type: 'text', title: 'Chấp nhận', payload: 'accept' },
                { content_type: 'text', title: 'Từ chối', payload: 'deny' }
            ]
        },
        threadID
    );
};

// Xử lý lệnh thách đấu
const handleChallengeCommand = (api, message, data) => {
    const { body, mentions, senderID, threadID } = message;
    const args = body.split(' ');
    
    if (args[0] === '!cao') {
        if (args.length < 3) {
            return api.sendMessage('🚫 Vui lòng nhập đủ thông tin: !cao @tên_người_dùng số_tiền', threadID);
        }

        const nameTag = args.slice(1, -1).join(' ').replace('@', '');
        const betAmount = parseFloat(args[args.length - 1]);

        if (isNaN(betAmount) || betAmount <= 0) {
            return api.sendMessage('🚫 Vui lòng nhập số tiền cược hợp lệ.', threadID);
        }

        const uid = getUidFromName(nameTag);
        if (!uid) {
            return api.sendMessage('🚫 Tên người dùng không hợp lệ hoặc chưa đăng ký. Yêu cầu người dùng sử dụng lệnh !register để đăng ký.', threadID);
        }

        const player = data.find(user => user.senderID === senderID);
        if (!player) {
            return api.sendMessage('🚫 Không tìm thấy thông tin của người chơi bạn.', threadID);
        }

        if (player.money < betAmount) {
            return api.sendMessage('🚫 Bạn không đủ tiền trong tài khoản để cược.', threadID);
        }

        // Lưu thông tin thách đấu
        const challengeData = {
            challengerID: senderID,
            opponentID: uid,
            betAmount: betAmount,
            status: 'pending'
        };

        const challengeFilePath = path.join(__dirname, '../data/challenges.json');
        let challenges = [];
        if (fs.existsSync(challengeFilePath)) {
            challenges = JSON.parse(fs.readFileSync(challengeFilePath, 'utf8'));
        }
        challenges.push(challengeData);
        fs.writeFileSync(challengeFilePath, JSON.stringify(challenges, null, 2), 'utf8');

        // Gửi thông báo thách đấu
        sendChallengeMessage(api, threadID, senderID, nameTag, betAmount);
    }
};

// Xuất đối tượng module với thuộc tính name và phương thức execute
module.exports = {
    name: 'cao',
    execute: (message, api) => {
        const { body, threadID, senderID } = message;
        const dataFilePath = path.join(__dirname, '../data/data.json');
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

        if (body.startsWith('!cao')) {
            handleChallengeCommand(api, message, data);
        } else if (body.startsWith('!caccept') || body.startsWith('!cdeny') || body.startsWith('!cstop')) {
            // Xử lý các lệnh chấp nhận, từ chối hoặc hủy bỏ thách đấu
            const challengeFilePath = path.join(__dirname, '../data/challenges.json');
            if (fs.existsSync(challengeFilePath)) {
                const challenges = JSON.parse(fs.readFileSync(challengeFilePath, 'utf8'));
                const challengeIndex = challenges.findIndex(c => c.opponentID === senderID && c.status === 'pending');
                if (challengeIndex === -1) {
                    return api.sendMessage('🚫 Không tìm thấy thách đấu đang chờ xử lý.', threadID);
                }

                const challenge = challenges[challengeIndex];
                if (body.startsWith('!caccept')) {
                    // Xử lý chấp nhận thách đấu
                    api.sendMessage(`🎉 Bạn đã chấp nhận thách đấu với số tiền cược ${challenge.betAmount} VND.`, threadID);
                    // Tiến hành trò chơi
                    // ...

                } else if (body.startsWith('!cdeny')) {
                    // Xử lý từ chối thách đấu
                    api.sendMessage(`🚫 Bạn đã từ chối thách đấu với ${getNameFromUid(challenge.challengerID)}.`, threadID);
                    
                } else if (body.startsWith('!cstop')) {
                    // Xử lý hủy bỏ thách đấu
                    challenges.splice(challengeIndex, 1);
                    fs.writeFileSync(challengeFilePath, JSON.stringify(challenges, null, 2), 'utf8');
                    api.sendMessage(`🚫 Bạn đã hủy bỏ thách đấu với ${getNameFromUid(challenge.challengerID)}.`, threadID);
                }
            }
        }
    }
};

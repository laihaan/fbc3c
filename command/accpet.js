const fs = require('fs').promises;
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/data.json');
const gamesFilePath = path.join(__dirname, '../data/games.json');
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

module.exports = {
    name: 'accept',
    execute: async (message, api) => {
        const uid = message.senderID;


        const [gamesData, usersData] = await Promise.all([
            fs.readFile(gamesFilePath, 'utf8'),
            fs.readFile(dataFilePath, 'utf8')
        ]);

        const games = JSON.parse(gamesData);
        const users = JSON.parse(usersData);


        const game = games.find(game => game.receiverID === uid && game.status === 'pending');

        if (!game) {
            return api.sendMessage('🚫 Không có lời mời chơi nào để chấp nhận.', message.threadID);
        }


        const sender = users.find(user => user.senderID === game.senderID);
        const receiver = users.find(user => user.senderID === uid);

        if (!sender || !receiver) {
            return api.sendMessage('🚫 Không tìm thấy thông tin người chơi. Vui lòng kiểm tra lại.', message.threadID);
        }


        const deck = createDeck();
        const handSender = drawHand(deck);
        const handReceiver = drawHand(deck);

        const senderScore = calculateScore(handSender);
        const receiverScore = calculateScore(handReceiver);


        let winner, loser;
        if (senderScore > receiverScore) {
            winner = sender;
            loser = receiver;
        } else if (senderScore < receiverScore) {
            winner = receiver;
            loser = sender;
        } else {
            winner = loser = null; 
        }

        if (winner) {

            winner.money += game.betAmount;
            loser.money -= game.betAmount;


            const updatedGames = games.filter(g => g !== game);
            await Promise.all([
                fs.writeFile(gamesFilePath, JSON.stringify(updatedGames, null, 2)),
                fs.writeFile(dataFilePath, JSON.stringify(users, null, 2))
            ]);

            api.sendMessage(`🎉 Chúc mừng! @${winner.name} thắng cuộc. Số tiền cược được cộng vào người thắng và trừ từ người thua.`, message.threadID);
        } else {
            api.sendMessage('🔁 Trận đấu hòa. Không có tiền cược nào được thay đổi.', message.threadID);
        }
    }
};

function createDeck() {
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

function drawHand(deck) {
    const hand = [];
    for (let i = 0; i < 3; i++) {
        const card = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
        hand.push(card);
    }
    return hand;
}

function calculateScore(hand) {
    const cardValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 1 };
    let total = hand.reduce((sum, card) => sum + cardValues[card.value], 0);
    return total % 10;
}

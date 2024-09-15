import {lobbyManager} from "@src/modules/pubg/gameplay/lobbyManager";

// Событие входа игрока в колшэйп
mp.events.add('playerEnterColshape', async (player, shape) => {
    if (shape === lobbyManager.gameStartColshape) {
        const lobby = lobbyManager.findAvailableLobby();
        if (!lobby.isGameActive) {
            await lobby.getRandomPositionInTerritory(player).then((res) => {
                if (res.x === 0 && res.y === 0 && res.z === 0) {
                    lobby.excludePlayerFromLobby(player)
                    player.notify(`не удалось начать игру`)
                    return
                }
                player.spawn(res);
                lobby.players.set(player.id, player);
                player.dimension = lobby.dimension;
                player.notify(`Вы присоединились к лобби. Ждите начала игры!`);
                if (lobby.players.size === 1) {
                    lobby.startLobbyCountdown();
                }
            })
        }
    }
});

// Событие, когда игрок заходит на сервер. Спавним рядом со входом в режим для удобства
mp.events.add('playerJoin', (player) => {
    player.spawn(lobbyManager.spawnPosition);
    player.notify('Добро пожаловать! Вы были перемещены в зону старта.');
});
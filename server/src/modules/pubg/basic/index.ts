import {
    findAvailableLobby,
    getRandomPositionInTerritory,
    startLobbyCountdown
} from "@src/modules/pubg/gameplay";
import { excludePlayerFromLobby} from "@src/modules/pubg/death";

// Позиция маркера для входа в режим игры
const markerPosition = new mp.Vector3(123.47, -25.10, 66.5)

// Создаем маркер
mp.markers.new(1, markerPosition, 4, {
    color: [152, 156, 197, 68],
    visible: true,
    dimension: 0
});

// Создаем колшэйп для входа в игровой режим
const gameStartColshape = mp.colshapes.newSphere(markerPosition.x, markerPosition.y, markerPosition.z, 2);

// Событие входа игрока в колшэйп
mp.events.add('playerEnterColshape', async (player, shape) => {
    if (shape === gameStartColshape) {
        const lobby = findAvailableLobby();
        if (!lobby.isGameActive) {
            lobby.players.set(player.id, player);
            player.dimension = lobby.dimension;
            await getRandomPositionInTerritory(lobby, player).then((res) => {
                if (res.x === 0 && res.y === 0 && res.z === 0) {
                    excludePlayerFromLobby(player, lobby)
                    return
                }
                player.spawn(res);
                player.notify(`Вы присоединились к лобби. Ждите начала игры!`);
                if (lobby.players.size === 1) {
                    startLobbyCountdown(lobby);
                }
            })
        }
    }
});

// Событие, когда игрок заходит на сервер. Спавним рядом со входом в режим для удобства
mp.events.add('playerJoin', (player) => {
    const spawnPosition = new mp.Vector3(markerPosition.x - 2, markerPosition.y - 5, markerPosition.z); // Спавн рядом с маркером
    player.spawn(spawnPosition);
    player.notify('Добро пожаловать! Вы были перемещены в зону старта.');
});
import {locationsGame} from "@src/modules/pubg/basic/locations";
import {GroundHeightTypes} from "@shared/types/groundHeightTypes";
import {randomFloatBetween} from "@src/utils/math";
import {callClient, callClientAsync} from "@shared/rpcWrapper";
import {handleError} from "@src/utils/handleError";
import {ItemsPubgTypes} from "@shared/types/weaponPubgTypes";
import {deleteLobbyEndGame, GameItem, GameLobby, lobbies} from "@src/modules/pubg/gameplay/lobbies";
import {startAllCountsForLobby, excludePlayerFromLobby} from "@src/modules/pubg/death";
import {startZonePubg} from "@src/modules/pubg/zone";

let nextDimension = 1;

const createLobby = (): GameLobby => {
    const randomTerritory = locationsGame[Math.floor(Math.random() * locationsGame.length)];
    const newLobby: GameLobby = {
        dimension: nextDimension++,
        players: new Map(),
        countdown: null,
        isGameActive: false,
        territory: randomTerritory,
        items: [],
        colshape: undefined,
        currentPhase: 0,
        radius: 0
    };
    lobbies.push(newLobby);
    return newLobby;
};

export const findAvailableLobby = (): GameLobby => {
    // Поиск существующего лобби, где еще не началась игра
    const lobby = lobbies.find((lobby) => !lobby.isGameActive && lobby.players.size < 10);
    return lobby || createLobby();
};

export const startLobbyCountdown = async (lobby: GameLobby) => {
    let countdown = 10; // Время до старта игры в секундах
    lobby.countdown = setInterval(() => {
        countdown--;
        // Отправляем информацию о таймере всем игрокам в лобби
        lobby.players.forEach((player) => {
            player.notify(`Игра начнется через ${countdown} секунд.`);
        });
        if (countdown <= 0) {
            clearInterval(lobby.countdown!);
            startGame(lobby);
        }
    }, 1000); // Интервал в миллисекундах
};

const startGame = async (lobby: GameLobby) => {
    if(lobby.players.size === 1){
        const player: PlayerMp = lobby.players.values().next().value
        if(player){
            player.notify('Старт игры отменен')
        }
        return deleteLobbyEndGame(lobby)
    }
    lobby.isGameActive = true;
    // Спавн оружия рандомно
    await spawnWeaponsAndArmor(lobby)
    // Подготавливаем список позиций предметов в мире,
    // чтобы клиент мог считать расстояние и подсвечивать близкие предметы,
    // а также уведомлять о необходимости подбора.
    const items: ItemsPubgTypes[] = lobby.items.map((item) => {
        return {object: item.object, position: item.position}
    })
    // Включаем счетчики для игроков (Живых/Убитых)
    await startAllCountsForLobby(lobby)
    // Перемещаем всех игроков в рандомные позиции
    lobby.players.forEach((player) => {
        getRandomPositionInTerritory(lobby, player).then((res) => {
            if(res.x === 0 && res.y === 0 && res.z === 0) {
                excludePlayerFromLobby(player, lobby)
                return
            }
            player.spawn(res);
            callClient(player, 'updateItemsGame', items)
        })
    });
    // Стартуем зонирование
    await startZonePubg(lobby)
};

// Функция для получения случайной позиции на территории
export const getRandomPositionInTerritory = async (lobby: GameLobby, player: PlayerMp): Promise<Vector3> => {
    const territory = lobby.territory;
    const maxRetries = 10; // Максимальное количество попыток
    let attempt = 0;

    while (attempt < maxRetries) {
        const randomX = randomFloatBetween(territory.minPosition.x, territory.maxPosition.x);
        const randomY = randomFloatBetween(territory.minPosition.y, territory.maxPosition.y);
        let randomZ: number | null = null;
        // Запрашиваем высоту земли для случайных координат
        await callClientAsync<GroundHeightTypes, number>(player, "getGroundHeight", { x: randomX, y: randomY })
            .then((res: number) => {
                randomZ = res;
                console.log(randomX)
                console.log(randomY)
                console.log(res)
            })
            .catch((err) => handleError(player, err));
        // Если получили корректные координаты, возвращаем их
        if (randomZ !== null && randomZ !== 0) {
            return new mp.Vector3(randomX, randomY, randomZ);
        }
        attempt++;
    }
    // Если после всех попыток не удалось получить корректные координаты, возвращаем координаты по умолчанию
    return new mp.Vector3(0, 0, 0);
};

// Список хэшей предметов для спавна
const itemHashes = [
    { type: "weapon", hash: "w_sb_assaultsmg", weaponHash: 736523883 },
    { type: "weapon", hash: "w_ar_specialcarbine", weaponHash: 3231910285 },
    { type: "weapon", hash: "w_sg_heavyshotgun", weaponHash: 984333226 },
    { type: "weapon", hash: "w_sr_heavysniper", weaponHash: 205991906 },
    { type: "weapon", hash: "w_ar_assaultrifle", weaponHash: 961495388 },
    { type: "weapon", hash: "w_ar_carbinerifle", weaponHash: 2210333304 },
    { type: "weapon", hash: "w_pi_flaregun", weaponHash: 3415619887 },
    { type: "weapon", hash: "w_sb_gusenberg", weaponHash: 1627465347 },
    { type: "armor", hash: "prop_armour_pickup" },
    { type: "armor", hash: "prop_bodyarmour_06" },
    { type: "health", hash: "prop_ld_health_pack" },
];

// Функция для спавна оружия и бронежилетов
const spawnWeaponsAndArmor = async (lobby: GameLobby) => {
    const numberOfItems = 50; // Количество предметов для спавна.
    // Берем первого игрока из лобби для получения высоты
    const player = lobby.players.values().next().value;
    if (!player) {
        console.error("В лобби нет игроков для получения позиции.");
        return;
    }
    const spawnPromises = [];
    for (let i = 0; i < numberOfItems; i++) {
        const randomItem = itemHashes[Math.floor(Math.random() * itemHashes.length)];
        const spawnPromise = getRandomPositionInTerritory(lobby, player).then((pos) => {
            // Поднимаем предметы на 1 единицу над землей
            pos.z += 1;
            // Спавним предмет в мире
            const object = mp.objects.new(randomItem.hash, pos, {
                dimension: lobby.dimension,
                alpha: 255
            });
            // Сохраняем обьект и пушим в массив айтемов лобби
            const item: GameItem = {
                position: pos,
                type: randomItem.type as GameItem["type"],
                hash: randomItem.hash,
                object,
                weaponHash: randomItem.weaponHash
            };
            lobby.items.push(item);
        });
        spawnPromises.push(spawnPromise);
    }
    // Ждем завершения всех промисов
    await Promise.all(spawnPromises);
};
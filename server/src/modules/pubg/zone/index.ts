import {deleteLobbyEndGame, findLobbyByPlayerId, GameLobby} from "@src/modules/pubg/gameplay/lobbies";
import {callClient} from "@shared/rpcWrapper";
import {ZonePubg} from "@shared/types/zonePubg";

// Храним игроков вне зоны
const playersOutsideZone: Set<PlayerMp> = new Set();

// Фазы с таймингом и уроном
const phases = [
    { duration: 45000, pause: 60000, damage: 1 },  // Фаза 1
    { duration: 50000, pause: 55000, damage: 2 }, // Фаза 2
    { duration: 55000, pause: 50000, damage: 3 }, // Фаза 3
    { duration: 60000, pause: 45000, damage: 4 }, // Фаза 4
    { duration: 65000, pause: 40000, damage: 5 }, // Фаза 5
    { duration: 70000, pause: 35000, damage: 6 }, // Фаза 6
    { duration: 75000, pause: 30000, damage: 7 }, // Фаза 7
    { duration: 80000, pause: 25000, damage: 8 }, // Фаза 8
];

// Запускаем систему зоинрования
export const startZonePubg = async (lobby: GameLobby) => {
    if(lobby.players.size === 1) return deleteLobbyEndGame(lobby)
    const minPos = lobby.territory.minPosition
    const maxPos = lobby.territory.maxPosition
    const centerX = (minPos.x + maxPos.x) / 2;
    const centerY = (minPos.y + maxPos.y) / 2;
    const centerZ = (minPos.z + maxPos.z) / 2;
    const width = maxPos.x - minPos.x;
    const height = maxPos.y - minPos.y;
    const radius = Math.sqrt(2 * width * height) / 2;
    lobby.radius = radius
    lobby.baseRadius = radius
    lobby.colshape = mp.colshapes.newCircle(centerX, centerY, radius, lobby.dimension);
    const position = new mp.Vector3(centerX, centerY, centerZ)
    lobby.players.forEach((player) => {
        callClient<ZonePubg>(player, "updateViewZonePubg", {position: position, radius})
    })
    await manageZonePhases(position, lobby);
}

// Управление фазами зоны
const manageZonePhases = async (position: Vector3, lobby: GameLobby) => {

    const applyNextPhase = () => {
        if(lobby.players.size === 1) return deleteLobbyEndGame(lobby)
        const currentPhase = lobby.currentPhase
        if (currentPhase >= phases.length) return;
        const { duration, pause, damage } = phases[currentPhase];
        lobby.currentPhase++;
        lobby.players.forEach((player) => {
            callClient(player, "UpdatePhaseZone", lobby.currentPhase)
        })
        shrinkZoneGradually(position, lobby, duration, () => {
            setTimeout(applyNextPhase, pause); // Пауза перед следующей фазой
        });
    };

    applyNextPhase();
};

// Плавное сужение зоны
const shrinkZoneGradually = async (position: Vector3, lobby: GameLobby, duration: number, onComplete: Function) => {
    if(lobby.players.size === 1) return deleteLobbyEndGame(lobby)
    const minRadius = 10;
    // Вычисляем уменьшение радиуса для текущей фазы в секунду
    const totalPhase = phases.length
    const countOneStep = lobby.baseRadius / totalPhase
    const speedChange = countOneStep / (duration / 100)
    const steps = countOneStep / speedChange
    let step = 0
    const shrinkZoneInterval = setInterval(() => {
        if (step >= steps || lobby.radius <= minRadius) {
            clearInterval(shrinkZoneInterval);
            onComplete();
            return;
        }
        lobby.radius -= speedChange;
        if (lobby.colshape) lobby.colshape.destroy();
        lobby.colshape = mp.colshapes.newCircle(position.x, position.y, lobby.radius, lobby.dimension);
        lobby.players.forEach((player) => {
            callClient<ZonePubg>(player, "updateZonePubg", { position, radius: lobby.radius });
            monitorPlayerPosition(player, phases[lobby.currentPhase].damage,lobby)
        });
        step++
    }, 100);
};

// Нанесение урона игроку вне зоны
const startDamageOverTime = (player: PlayerMp, damage: number, delay: number = 5000) => {
    // Устанавливаем таймер для задержки перед началом урона
    setTimeout(() => {
        // Начинаем наносить урон с интервалом
        const damageInterval = setInterval(() => {
            if (playersOutsideZone.has(player)) {
                if (player.dimension === 0) {
                    clearInterval(damageInterval);
                    return playersOutsideZone.delete(player); // Останавливаем урон при выходе
                }

                player.health -= damage; // Наносим урон в зависимости от фазы

                if (player.health <= 0) {
                    clearInterval(damageInterval);
                    playersOutsideZone.delete(player); // Останавливаем урон при смерти
                }
            } else {
                clearInterval(damageInterval); // Останавливаем урон, если игрок вернулся в зону
            }
        }, 1000); // Наносим урон каждую секунду
    }, delay); // Задержка перед началом урона
};

export const resetAllZones = async (player: PlayerMp) => {
    callClient(player, "resetViewZonePubg")
}

const checkPlayerInColshape = (player: PlayerMp, colshape: ColshapeMp) => {
    // Проверка находится ли точка внутри колшейпа
    return colshape.isPointWithin(player.position);
};

const monitorPlayerPosition = (player: PlayerMp, damage: number, lobby: GameLobby) => {
    const checkInterval = 1000; // Интервал проверки
    const damageInterval = 5000; // Интервал старта нанесения урона

    const interval = setInterval(() => {
        if (player && lobby.colshape) {
            // Проверяем, находится ли игрок за пределами колшейпа
            if (!checkPlayerInColshape(player, lobby.colshape)) {
                if (!playersOutsideZone.has(player)) {
                    playersOutsideZone.add(player);
                    // Начинаем наносить урон, если игрок за пределами
                    startDamageOverTime(player, damage, damageInterval);
                }
            } else {
                if (playersOutsideZone.has(player)) {
                    playersOutsideZone.delete(player);
                    clearInterval(interval)
                    // Останавливаем урон, если игрок вернулся в зону
                }
            }
        }
    }, checkInterval);
};
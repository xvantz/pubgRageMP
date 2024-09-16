import {ItemsPubgTypes} from "@shared/types/weaponPubgTypes";
import {callClient, callClientAsync} from "@shared/rpcWrapper";
import {randomFloatBetween} from "@src/utils/math";
import {GroundHeightTypes} from "@shared/types/groundHeightTypes";
import {CatchErrors, handleError} from "@src/utils/handleError";
import {GameItem, LocationsGame} from "@shared/types/lobbyTypes";
import {setPlayerArmour, setPlayerHP, setPlayerWeapon} from "@src/utils/player";
import {KillDataPubg} from "@shared/types/playerDeadPubg";
import {ZonePubg} from "@shared/types/zonePubg";

export class GameLobby {
    readonly #id: number
    players: Map<number, PlayerMp> = new Map();
    #countdown: NodeJS.Timeout | null = null;
    isGameActive: boolean = false;
    readonly #territory: LocationsGame;
    #items: GameItem[] = [];
    readonly dimension: number;
    #currentPhase: number;
    #radius: number = 0;
    #baseRadius: number = 0;
    #colshape: ColshapeMp = null
    #playersOutsideZone: Set<PlayerMp> = new Set();
    readonly #onDestroy: (id: number) => void;
    readonly #playerMin: number = 2
    readonly #itemHashes = [
        {type: "weapon", hash: "w_sb_assaultsmg", weaponHash: 736523883},
        {type: "weapon", hash: "w_ar_specialcarbine", weaponHash: 3231910285},
        {type: "weapon", hash: "w_sg_heavyshotgun", weaponHash: 984333226},
        {type: "weapon", hash: "w_sr_heavysniper", weaponHash: 205991906},
        {type: "weapon", hash: "w_ar_assaultrifle", weaponHash: 961495388},
        {type: "weapon", hash: "w_ar_carbinerifle", weaponHash: 2210333304},
        {type: "weapon", hash: "w_pi_flaregun", weaponHash: 3415619887},
        {type: "weapon", hash: "w_sb_gusenberg", weaponHash: 1627465347},
        {type: "armor", hash: "prop_armour_pickup"},
        {type: "armor", hash: "prop_bodyarmour_06"},
        {type: "health", hash: "prop_ld_health_pack"},
    ];
    readonly #phases = [
        {duration: 45000, pause: 60000, damage: 1},  // Фаза 1
        {duration: 50000, pause: 55000, damage: 2}, // Фаза 2
        {duration: 55000, pause: 50000, damage: 3}, // Фаза 3
        {duration: 60000, pause: 45000, damage: 4}, // Фаза 4
        {duration: 65000, pause: 40000, damage: 5}, // Фаза 5
        {duration: 70000, pause: 35000, damage: 6}, // Фаза 6
        {duration: 75000, pause: 30000, damage: 7}, // Фаза 7
        {duration: 80000, pause: 25000, damage: 8}, // Фаза 8
    ];
    readonly #startPosition: Vector3
    #intervalActiveGame: NodeJS.Timeout | null = null;
    #isDeletingLobby: boolean
    #playersDamageIntervals: Map<PlayerMp, NodeJS.Timeout> = new Map();

    constructor(id: number, dimension: number, territory: LocationsGame, onDestroy: (id: number) => void, startPosition: Vector3) {
        this.#id = id
        this.dimension = dimension;
        this.#territory = territory;
        this.#onDestroy = onDestroy;
        this.#startPosition = startPosition
        this.#isDeletingLobby = false
        this.#currentPhase = 0
    }

    @CatchErrors()
    public async startLobbyCountdown() {
        let countdown = 10; // Время до старта игры в секундах
        this.#countdown = setInterval(() => {
            if(this.isGameActive){
                clearInterval(this.#countdown);
                this.#countdown = null;
                countdown = 0
                return
            }
            countdown--;
            // Отправляем информацию о таймере всем игрокам в лобби
            this.players.forEach((player) => {
                if(this.checkPlayer(player)) player.notify(`Игра начнется через ${countdown} секунд.`);
            });
            if (countdown <= 0) {
                clearInterval(this.#countdown);
                this.#countdown = null
                this.startGame();
            }
        }, 1000);
    }

    @CatchErrors()
    private async startGame() {
        this.isGameActive = true;
        // Спавн оружия рандомно
        await this.spawnWeaponsAndArmor()
        // Подготавливаем список позиций предметов в мире,
        // чтобы клиент мог считать расстояние и подсвечивать близкие предметы,
        // а также уведомлять о необходимости подбора.
        const items: ItemsPubgTypes[] = this.#items.map((item) => {
            return {object: item.object, position: item.position}
        })
        // Включаем счетчики для игроков (Живых/Убитых)
        await this.startAllCountsForLobby()
        // Перемещаем всех игроков в рандомные позиции
        this.players.forEach((player) => {
            if(!this.checkPlayer(player)) return
            this.getRandomPositionInTerritory(player).then((res) => {
                if (res.x === 0 && res.y === 0 && res.z === 0) {
                    this.excludePlayerFromLobby(player)
                    return
                }
                player.spawn(res);
                callClient(player, 'updateItemsGame', items)
            })
        });
        // Стартуем зонирование
        await this.startZonePubg()
    }

    @CatchErrors()
    public async getRandomPositionInTerritory(player: PlayerMp): Promise<Vector3> {
        const territory = this.#territory;
        const maxRetries = 10; // Максимальное количество попыток
        let attempt = 0;

        while (attempt < maxRetries) {
            const randomX = randomFloatBetween(territory.minPosition.x, territory.maxPosition.x);
            const randomY = randomFloatBetween(territory.minPosition.y, territory.maxPosition.y);
            let randomZ: number | null = null;
            // Запрашиваем высоту земли для случайных координат
            if(!this.checkPlayer(player)) return
            await callClientAsync<GroundHeightTypes, number>(player, "getGroundHeight", {x: randomX, y: randomY})
                .then((res: number) => {
                    randomZ = res;
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
    }

    @CatchErrors()
    private async spawnWeaponsAndArmor() {
        const numberOfItems = 50;
        // Берем первого игрока из лобби для получения высоты
        const player = this.players.values().next().value;
        if (!player) {
            console.error("В лобби нет игроков для получения позиции.");
            return;
        }
        const spawnPromises = [];
        for (let i = 0; i < numberOfItems; i++) {
            const randomItem = this.#itemHashes[Math.floor(Math.random() * this.#itemHashes.length)];
            if(!this.checkPlayer(player)) return
            const spawnPromise = this.getRandomPositionInTerritory(player).then((pos) => {
                // Поднимаем предметы на 1 единицу над землей
                pos.z += 1;
                // Спавним предмет в мире
                const object = mp.objects.new(randomItem.hash, pos, {
                    dimension: this.dimension,
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
                this.#items.push(item);
            });
            spawnPromises.push(spawnPromise);
        }
        // Ждем завершения всех промисов
        await Promise.all(spawnPromises);
    }

    @CatchErrors()
    public async excludePlayerFromLobby(player: PlayerMp) {
        if (this.players.has(player.id)) {
            callClient(player, 'updateItemsGame', [])
            this.resetAllCounts(player)
            this.resetAllZones(player)
            this.players.delete(player.id); // Удаляем игрока из списка лобби
        }
    }

    @CatchErrors()
    public async givePlayerItemInGame(player: PlayerMp, weaponObject: ObjectMp) {
        if (this.checkPlayer(player)) {
            const item = this.#items.find((item) => item.object === weaponObject)
            if (!item) return;
            switch (item.type) {
                case "weapon": {
                    setPlayerWeapon(player, item.weaponHash, 30)
                    break;
                }
                case "armor": {
                    setPlayerArmour(player, 100)
                    break
                }
                case "health": {
                    setPlayerHP(player, 100)
                }
            }
            this.deleteItemInLobby(item.object)
            item.object.destroy()
        }
    }

    @CatchErrors()
    private deleteItemInLobby(itemDel: ObjectMp) {
        const findIndex = this.#items.findIndex((item) => item.object === itemDel)
        if (findIndex !== -1) {
            this.#items.splice(findIndex, 1);
            this.players.forEach((player) => {
                if(!this.checkPlayer(player)) return
                callClient(player, "deleteItemsGame", itemDel)
            })
        }
    }

    @CatchErrors()
    private async startAllCountsForLobby() {
        this.players.forEach((player) => {
            this.updateViewCounts(player, true)
        })
        await this.updateLivedPlayersInLobby()
    }

    @CatchErrors()
    private async updateViewCounts(player: PlayerMp, value: boolean) {
        if(!this.checkPlayer(player)) return
        callClient(player, "updateViewCountsPubg", value)
    }

    @CatchErrors()
    public async updateLivedPlayersInLobby() {
        const count = this.players.size
        this.players.forEach((player) => {
            if(!this.checkPlayer(player)) return
            callClient(player, "updatePubgLivedPlayersCount", count)
        })
    }

    @CatchErrors()
    public async updatePlayerKills(player: PlayerMp) {
        if(!this.checkPlayer(player)) return
        callClient(player, "updateKilledPubgPlayersCount")
        player.notify(`Вы убили игрока`)
    }

    @CatchErrors()
    public resetAllCounts(player: PlayerMp) {
        if(!this.checkPlayer(player)) return
        callClient(player, "resetAllCountsPubg")
    }

    @CatchErrors()
    public async addKillBarNew(player: PlayerMp, killer: PlayerMp) {
        if(!this.checkPlayer(player)) return
        const killData: KillDataPubg = {killerName: killer.name, killedName: player.name, time: Date.now()}
        this.players.forEach((player) => {
            callClient<KillDataPubg>(player, "killInfoViewPubg", killData)
        })
    }

    @CatchErrors()
    private async startZonePubg() {
        this.checkCountPlayers()
        const minPos = this.#territory.minPosition
        const maxPos = this.#territory.maxPosition
        const centerX = (minPos.x + maxPos.x) / 2;
        const centerY = (minPos.y + maxPos.y) / 2;
        const centerZ = (minPos.z + maxPos.z) / 2;
        const width = maxPos.x - minPos.x;
        const height = maxPos.y - minPos.y;
        const radius = Math.sqrt(2 * width * height) / 2;
        this.#radius = radius
        this.#baseRadius = radius
        this.#colshape = mp.colshapes.newCircle(centerX, centerY, radius, this.dimension);
        const position = new mp.Vector3(centerX, centerY, centerZ)
        this.players.forEach((player) => {
            if(!this.checkPlayer(player)) return
            callClient<ZonePubg>(player, "updateViewZonePubg", {position: position, radius})
        })
        await this.manageZonePhases(position);
    }

    @CatchErrors()
    private async manageZonePhases(position: Vector3) {
        const applyNextPhase = () => {
            this.checkCountPlayers()
            const currentPhase = this.#currentPhase
            if (currentPhase >= this.#phases.length) return;
            const {duration, pause, damage} = this.#phases[currentPhase];
            this.#currentPhase++;
            this.players.forEach((player) => {
                if(!this.checkPlayer(player)) return
                callClient(player, "UpdatePhaseZone", this.#currentPhase)
            })
            this.shrinkZoneGradually(position, duration, damage, () => {
                setTimeout(applyNextPhase, pause); // Пауза перед следующей фазой
            })
        };
        applyNextPhase();
    };

    @CatchErrors()
    private async shrinkZoneGradually(position: Vector3, duration: number, damage: number, onComplete: Function) {
        this.checkCountPlayers()
        const minRadius = 10;
        // Вычисляем уменьшение радиуса для текущей фазы в секунду
        const totalPhase = this.#phases.length
        const countOneStep = this.#baseRadius / totalPhase
        const speedChange = countOneStep / (duration / 100)
        const steps = countOneStep / speedChange
        let step = 0
        this.players.forEach((player) => {
            this.monitorPlayerPosition(player, damage)
        })
        const shrinkZoneInterval = setInterval(() => {
            if (step >= steps || this.#radius <= minRadius) {
                clearInterval(shrinkZoneInterval);
                onComplete();
                return;
            }
            this.#radius -= speedChange;
            if (this.#colshape){
                this.#colshape.destroy();
                this.#colshape = null
            }
            this.#colshape = mp.colshapes.newCircle(position.x, position.y, this.#radius, this.dimension);
            this.players.forEach((player) => {
                if(!this.checkPlayer(player)) return
                callClient<ZonePubg>(player, "updateZonePubg", {position, radius: this.#radius});
            });
            step++
        }, 100);
    };

    @CatchErrors()
    private startDamageOverTime(player: PlayerMp, damage: number, delay: number = 1000) {
        if(!this.checkPlayer(player)) return
        // Устанавливаем таймер для задержки перед началом урона
        setTimeout(() => {
            // Начинаем наносить урон с интервалом
            const damageInterval: NodeJS.Timeout = setInterval(() => {
                if(!this.checkEnoughPlayer()) return clearInterval(damageInterval)
                if (this.#playersOutsideZone.has(player)) {
                    if (player.dimension === 0) {
                        clearInterval(damageInterval);
                        return this.#playersOutsideZone.delete(player); // Останавливаем урон при выходе
                    }

                    player.health -= damage; // Наносим урон в зависимости от фазы

                    if (player.health <= 0) {
                        clearInterval(damageInterval);
                        this.#playersOutsideZone.delete(player); // Останавливаем урон при смерти
                    }
                } else {
                    clearInterval(damageInterval); // Останавливаем урон, если игрок вернулся в зону
                }
            }, 1000); // Наносим урон каждую секунду
        }, delay); // Задержка перед началом урона
    };

    @CatchErrors()
    public resetAllZones(player: PlayerMp) {
        if(!this.checkPlayer(player)) return
        callClient(player, "resetViewZonePubg")
    }

    @CatchErrors()
    private checkPlayerInColshape(player: PlayerMp): boolean {
        if(this.checkPlayer(player) && this.#colshape !== null) {
            // Проверка находится ли точка внутри колшейпа
            return this.#colshape.isPointWithin(player.position);
        }else{
            return true
        }
    };

    @CatchErrors()
    private async monitorPlayerPosition(player: PlayerMp, damage: number) {
        if(!this.checkPlayer(player)) return
        const checkInterval = 1000; // Интервал проверки
        const damageInterval = 1000; // Интервал старта нанесения урона

        if (this.#playersDamageIntervals.has(player)) {
            clearInterval(this.#playersDamageIntervals.get(player));
            this.#playersDamageIntervals.delete(player);
        }

        const interval = setInterval(() => {
            if (this.checkPlayer(player) && this.#colshape !== null) {
                // Проверяем, находится ли игрок за пределами колшейпа
                if (!this.checkPlayerInColshape(player)) {
                    if (!this.#playersOutsideZone.has(player)) {
                        this.#playersOutsideZone.add(player);
                        // Начинаем наносить урон, если игрок за пределами
                        this.startDamageOverTime(player, damage, damageInterval);
                    }
                } else {
                    if (this.#playersOutsideZone.has(player)) {
                        this.#playersOutsideZone.delete(player);
                        // Останавливаем урон, если игрок вернулся в зону
                    }
                }
            }
        }, checkInterval);

        this.#playersDamageIntervals.set(player, interval);
    }

    @CatchErrors()
    private onDeleteLobby() {
        if(this.#isDeletingLobby) return
        this.#isDeletingLobby = true
        clearInterval(this.#intervalActiveGame)
        this.#intervalActiveGame = null;
        this.#playersOutsideZone.clear()
        this.players.forEach((player) => {
            if(!this.checkPlayer(player)) return
            player.spawn(this.#startPosition)
            callClient(player, 'updateItemsGame', [])
            this.resetAllCounts(player)
            this.resetAllZones(player)
            player.dimension = 0
            player.removeAllWeapons()
            player.notify(`Игра завершена`)
        })
        this.players.clear()
        this.#playersDamageIntervals.forEach((interval) => {
            clearInterval(interval)
        })
        this.#playersDamageIntervals.clear()
        this.#items.forEach((item) => {
            if (item.object) {
                try {
                    item.object.destroy();
                } catch (error) {
                    console.error(`Ошибка при уничтожении объекта: ${error}`);
                }
            } else {
                console.warn(`Объект уже удалён или недоступен: ${item.object}`);
            }
        })
        this.#colshape.destroy()
        this.#colshape = null
        this.#onDestroy(this.#id)
    }

    @CatchErrors()
    private checkCountPlayers() {
        this.#intervalActiveGame = setInterval(() => {
            if(this.players.size < this.#playerMin) {
                this.onDeleteLobby()
            }
        }, 1000)
    }

    @CatchErrors()
    public checkEnoughPlayer(): boolean {
        return !(this.players.size < this.#playerMin)
    }

    @CatchErrors()
    private checkPlayer(player: PlayerMp): boolean {
        if(mp.players.exists(player) && this.players.has(player.id)){
            return true
        }else if(!mp.players.exists(player) && this.players.has(player.id)){
            this.players.delete(player.id);
            if(this.#playersDamageIntervals.has(player)){
                clearInterval(this.#playersDamageIntervals.get(player));
                this.#playersDamageIntervals.delete(player);
            }
            if(this.#playersOutsideZone.has(player)) this.#playersOutsideZone.delete(player)
            return false
        }else{
            return false
        }
    }
    @CatchErrors()
    public addPlayer(player: PlayerMp) {
        if(mp.players.exists(player)) this.players.set(player.id, player)
    }
}
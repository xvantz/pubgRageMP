import {locationsGame} from "@src/modules/pubg/basic/locations";
import {GameLobby} from "@src/modules/pubg/gameplay/lobby";

class LobbyManager {
    #lobbies: Map<number, GameLobby> = new Map()
    #nextDimension = 1;
    readonly #markerPosition: Vector3
    readonly gameStartColshape: ColshapeMp
    readonly spawnPosition: Vector3

    constructor() {
        this.#markerPosition = new mp.Vector3(123.47, -25.10, 66.5)
        this.gameStartColshape = mp.colshapes.newSphere(this.#markerPosition.x, this.#markerPosition.y, this.#markerPosition.z, 2);
        this.spawnPosition = new mp.Vector3(this.#markerPosition.x - 2, this.#markerPosition.y - 5, this.#markerPosition.z)
        mp.markers.new(1, this.#markerPosition, 4, {
            color: [152, 156, 197, 68],
            visible: true,
            dimension: 0
        });
    }

    public findLobbyByPlayerId(playerId: number): GameLobby {
        for (const lobby of this.#lobbies.values()) {
            if (lobby.players.has(playerId)) {
                return lobby;
            }
        }
        return undefined;
    }

    public deleteLobbyEndGame(id: number) {
        if (this.#lobbies.has(id)) {
            this.#lobbies.delete(id);
        }
    }

    private createLobby(): GameLobby {
        const randomTerritory = locationsGame[Math.floor(Math.random() * locationsGame.length)];
        const id = this.#lobbies.size
        const newLobby = new GameLobby(id, this.#nextDimension++, randomTerritory, this.deleteLobbyEndGame.bind(this), this.spawnPosition)
        this.#lobbies.set(id, newLobby);
        return newLobby;
    }

    public findAvailableLobby(): GameLobby {
        // Поиск существующего лобби, где еще не началась игра
        for (const lobby of this.#lobbies.values()) {
            if (!lobby.isGameActive && lobby.players.size < 10) {
                return lobby;
            }
        }
        return this.createLobby();
    }
}

export const lobbyManager = new LobbyManager();
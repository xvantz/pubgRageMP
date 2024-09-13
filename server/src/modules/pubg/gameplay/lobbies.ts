import {LocationsGame} from "@src/modules/pubg/basic/locations";

export type GameLobby = {
    dimension: number;
    players: Map<number, PlayerMp>;
    countdown: NodeJS.Timeout | null;
    isGameActive: boolean;
    territory: LocationsGame
    items: GameItem[]
    colshape: ColshapeMp | undefined
    currentPhase: number
    radius: number
    baseRadius?: number
}

export type GameItem = {
    position: Vector3;
    type: "weapon" | "armor" | "health";
    hash: string | number;
    object: ObjectMp
    weaponHash: string | number;
};

export const lobbies: GameLobby[] = [];

export const findLobbyByPlayerId = (playerId: number) => {
    return lobbies.find(lobby => lobby.players.has(playerId));
};

export const deleteLobbyEndGame = (lobby: GameLobby) => {
    const findIndex = lobbies.findIndex((l) => l === lobby)
    if(findIndex === -1) return
    lobbies.splice(findIndex, 1)
}
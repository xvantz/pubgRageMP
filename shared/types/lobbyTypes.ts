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

export type LocationsGame = {
    name: string,
    minPosition: Vector3,
    maxPosition: Vector3,
}
import {callClient, createEvent} from "@shared/rpcWrapper";
import {KillDataPubg, PlayerDeadPubg} from "@shared/types/playerDeadPubg";
import {findLobbyByPlayerId, GameLobby} from "@src/modules/pubg/gameplay/lobbies";
import {deleteLobbyEndGame} from "@src/modules/pubg/gameplay/lobbies";
import {resetAllZones} from "@src/modules/pubg/zone";

createEvent("playerDeadPubg", async (data: PlayerDeadPubg, info) => {
    const player = info.player as PlayerMp
    const killer = data.killer
    const foundPlayerInLobby = findLobbyByPlayerId(player.id)
    if(!foundPlayerInLobby) return
    await excludePlayerFromLobby(player, foundPlayerInLobby)
    await resetAllCounts(player)
    await resetAllZones(player)
    if(!killer) return
    await updatePlayerKills(killer)
    await updateLivedPlayersInLobby(foundPlayerInLobby)
    await addKillBarNew(player, killer, foundPlayerInLobby)
})

export const updatePlayerKills = async (player: PlayerMp) => {
    callClient(player, "updateKilledPubgPlayersCount")
    player.notify(`Вы убили игрока`)
}

export const updateLivedPlayersInLobby = async (lobby: GameLobby) => {
    const count = lobby.players.size
    lobby.players.forEach((player) => {
        callClient(player, "updatePubgLivedPlayersCount", count)
    })
}

export const resetAllCounts = async (player: PlayerMp) => {
    callClient(player, "resetAllCountsPubg")
}

export const updateViewCounts = async (player: PlayerMp, value: boolean) => {
    callClient(player, "updateViewCountsPubg", value)
}

export const startAllCountsForLobby = async (lobby: GameLobby) => {
    lobby.players.forEach((player) => {
        updateViewCounts(player, true)
    })
    await updateLivedPlayersInLobby(lobby)
}

export const addKillBarNew = async (player: PlayerMp, killer: PlayerMp, lobby: GameLobby) => {
    const killData: KillDataPubg = {killerName: killer.name, killedName: player.name, time: Date.now()}
    lobby.players.forEach((player) => {
        callClient<KillDataPubg>(player, "killInfoViewPubg", killData)
    })
}

export const excludePlayerFromLobby = async (player: PlayerMp, lobby: GameLobby) => {
    if (lobby.players.has(player.id)) {
        lobby.players.delete(player.id); // Удаляем игрока из списка лобби
        // Координаты точки входа
        const entryPoint = new mp.Vector3(121.47, -30.10, 66.5);
        // Телепортируем игрока к точке входа
        player.dimension = 0;
        player.health = 100
        player.spawn(entryPoint);
        // Уведомление игрока
        player.notify("Вы перемещены ко входу.");
    }
};
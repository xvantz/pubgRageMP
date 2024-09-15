import {createEvent} from "@shared/rpcWrapper";
import {PlayerDeadPubg} from "@shared/types/playerDeadPubg";
import {lobbyManager} from "@src/modules/pubg/gameplay/lobbyManager";

createEvent("playerDeadPubg", async (data: PlayerDeadPubg, info) => {
    const player = info.player as PlayerMp
    const killer = data.killer
    const lobby = lobbyManager.findLobbyByPlayerId(player.id)
    // Телепортируем игрока к точке входа
    player.dimension = 0;
    player.health = 100
    player.spawn(lobbyManager.spawnPosition);
    player.notify("Вы перемещены ко входу.");
    if(!lobby) return
    await lobby.excludePlayerFromLobby(player)
    await lobby.resetAllCounts(player)
    await lobby.resetAllZones(player)
    if(!killer) return
    await lobby.updatePlayerKills(killer)
    await lobby.updateLivedPlayersInLobby()
    await lobby.addKillBarNew(player, killer)
})
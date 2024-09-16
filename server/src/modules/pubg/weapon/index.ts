import {createEvent} from "@shared/rpcWrapper";
import {lobbyManager} from "@src/modules/pubg/gameplay/lobbyManager";

createEvent("givePlayerItemGame", async (weapon: ObjectMp, info) => {
    const player = info.player as PlayerMp
    const lobby = lobbyManager.findLobbyByPlayerId(player.id)
    if (!lobby) return
    await lobby.givePlayerItemInGame(player, weapon)
})
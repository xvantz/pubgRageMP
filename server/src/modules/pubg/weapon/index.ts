import {createEvent} from "@shared/rpcWrapper";
import {lobbyManager} from "@src/modules/pubg/gameplay/lobbyManager";

createEvent("givePlayerItemGame", async (weapon: ObjectMp, info) => {
    const player = info.player as PlayerMp
    await lobbyManager.findLobbyByPlayerId(player.id).givePlayerItemInGame(player, weapon)
})
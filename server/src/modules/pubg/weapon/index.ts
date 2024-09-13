import {GameLobby} from "@src/modules/pubg/gameplay/lobbies";
import {callClient, createEvent} from "@shared/rpcWrapper";
import {setPlayerArmour, setPlayerHP, setPlayerWeapon} from "@src/utils/player";
import {findLobbyByPlayerId} from "@src/modules/pubg/gameplay/lobbies";

const deleteItemInLobby = async (lobby: GameLobby, itemDel: ObjectMp) => {
    const findIndex = lobby.items.findIndex((item) => item.object === itemDel)
    if(findIndex !== -1){
        lobby.items.splice(findIndex, 1);
        lobby.players.forEach((player) => {
            callClient(player, "deleteItemsGame", itemDel)
        })
    }
}

export const givePlayerItemInGame = async (player: PlayerMp, weaponObject: ObjectMp) => {
    if (player) {
        const lobby = findLobbyByPlayerId(player.id)
        if(!lobby) return
        const item = lobby.items.find((item) => item.object === weaponObject)
        if(!item) return;
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
        await deleteItemInLobby(lobby, item.object)
        item.object.destroy()
    }
}

createEvent("givePlayerItemGame", async (weapon: ObjectMp, info) => {
    await givePlayerItemInGame(info.player as PlayerMp, weapon)
})
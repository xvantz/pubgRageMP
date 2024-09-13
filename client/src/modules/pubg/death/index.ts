import {callServer, createEvent} from "@shared/rpcWrapper";
import {
    $killedPlayersCount,
    $livedPlayersCount,
    updateKilledPlayersCount,
    updateLivedPlayersCount
} from "@src/modules/pubg/death/store";
import {KillDataPubg, PlayerDeadPubg} from "@shared/types/playerDeadPubg";
import {calculateTime} from "@src/utils/time";

let viewCountsPubg: boolean = false
let killbar: KillDataPubg[] = []

mp.events.add("playerDeath", (_, reason, killer) => {
    callServer<PlayerDeadPubg>("playerDeadPubg", {reason, killer})
})

createEvent("updatePubgLivedPlayersCount", (count: number) => {
    if(typeof count !== "number") return
    updateLivedPlayersCount(count)
})

createEvent("updateKilledPubgPlayersCount", () => {
    updateKilledPlayersCount($killedPlayersCount+1)
})

createEvent("updateViewCountsPubg", (view: boolean) => {
    if(typeof view !== "boolean") return
    viewCountsPubg = view
})

createEvent("killInfoViewPubg", (data: KillDataPubg) => {
    killbar.push(data)
})

createEvent("resetAllCountsPubg", () => {
    updateKilledPlayersCount(0)
    updateLivedPlayersCount(0)
    viewCountsPubg = false
})

const getKillBarInfo = () => {
    if(killbar.length < 1) return
    const updatedKillbar = killbar.filter((kill) => {
        const delTime = calculateTime(kill.time);
        return delTime < 1000; // Сохраняем элементы, где delTime меньше 1000
    });
    killbar = []
    killbar.push(...updatedKillbar);
    const startY = 0.17;
    killbar.forEach((kill, index) => {
        // Вычисляем Y-координату для текущего текста
        let currentY = startY + (index * 0.06);
        mp.game.graphics.drawText(`${kill.killerName} убил ${kill.killedName}`, [0.83, currentY], {
            font: 1,
            color: [255, 255, 255, 185],
            scale: [0.7, 0.7],
            outline: false,
            centre: true
        })
    })
}

mp.events.add("render", () => {
    if(!viewCountsPubg) return
    mp.game.graphics.drawText(`Живых: ${$livedPlayersCount}`, [0.9, 0.01], {
        font: 1,
        color: [255, 255, 255, 185],
        scale: [1.0, 1.0],
        outline: false,
        centre: true
    })
    mp.game.graphics.drawText(`Убито: ${$killedPlayersCount}`, [0.9, 0.09], {
        font: 1,
        color: [255, 255, 255, 185],
        scale: [1.0, 1.0],
        outline: false,
        centre: true
    })
    getKillBarInfo()
})
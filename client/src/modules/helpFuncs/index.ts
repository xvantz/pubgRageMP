import {createEventAsync} from "@shared/rpcWrapper";
import {GroundHeightTypes} from "@shared/types/groundHeightTypes";

export const getGroundHeight = async (xy: GroundHeightTypes): Promise<number | null> => {
    const maxZ = 1000; // Максимальная возможная высота

    let found = mp.game.gameplay.getGroundZFor3dCoord(xy.x, xy.y, maxZ, false, false);
    if (!found) {
        for (let i = maxZ; i >= 0; i -= 25) {
            mp.game.streaming.requestCollisionAtCoord(xy.x, xy.y, i);
            mp.game.wait(0);
        }
        found = mp.game.gameplay.getGroundZFor3dCoord(xy.x, xy.y, maxZ, false, false);
        if (!found) return null;
    }
    return found;
}

createEventAsync("getGroundHeight", async (xy: GroundHeightTypes) => {
    return getGroundHeight(xy)
})
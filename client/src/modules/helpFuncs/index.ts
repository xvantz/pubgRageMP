import {createEventAsync} from "@shared/rpcWrapper";
import {GroundHeightTypes} from "@shared/types/groundHeightTypes";

export const getGroundHeight = async (xy: GroundHeightTypes): Promise<number> => {
    const startZ = 1000.0; // Начальная высота для поиска
    let attempt = 0; // Счётчик попыток
    const maxAttempts = 50; // Максимальное количество попыток

    while (attempt < maxAttempts) {
        const found = mp.game.gameplay.getGroundZFor3dCoord(xy.x, xy.y, startZ, false, false);
        mp.gui.chat.push(`${found}`)
        if (found) {
            return found;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    return null; // Возвращаем null, если не удалось получить высоту после всех попыток
}

createEventAsync("getGroundHeight", async (xy: GroundHeightTypes) => {
    return getGroundHeight(xy)
})
import {createEventAsync} from "@shared/rpcWrapper";
import {GroundHeightTypes} from "@shared/types/groundHeightTypes";

export const getGroundHeight = async (xy: GroundHeightTypes): Promise<number | null> => {
    const maxAttempts = 10; // количество попыток
    const waitTime = 50; // время ожидания между попытками (мс)
    const minZ = 1; // Минимальная возможная высота
    const maxZ = 1000; // Максимальная возможная высота

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Используем бинарный поиск для нахождения высоты
        let low = minZ;
        let high = maxZ;

        while (high - low > 1) {
            const midZ = (low + high) / 2;
            const {groundZ, normal, result} = mp.game.gameplay.getGroundZAndNormalFor3DCoord(xy.x, xy.y, midZ);

            if (result) {
                return groundZ;
            } else if (midZ > groundZ) {
                high = midZ;
            } else {
                low = midZ;
            }
        }

        // Если бинарный поиск не нашел результат, ждем и пробуем снова
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    console.log(`Не удалось найти высоту для координат: x=${xy.x}, y=${xy.y}`);
    return null;
}

createEventAsync("getGroundHeight", async (xy: GroundHeightTypes) => {
    return getGroundHeight(xy)
})
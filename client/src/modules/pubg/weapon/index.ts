import {callServer, createEvent} from "@shared/rpcWrapper";
import {calculateDistance} from "@src/utils/player";
import {$localPlayer} from "@src/entities/player";
import {ItemsPubgTypes} from "@shared/types/weaponPubgTypes";

// Локальный список доступного оружия на клиенте
let itemsInGame: ItemsPubgTypes[] = [];

createEvent('updateItemsGame', (items: ItemsPubgTypes[]) => {
    itemsInGame = items
});

createEvent('deleteItemsGame', (itemDel: ObjectMp) => {
    const findIndex = itemsInGame.findIndex((item) => item.object === itemDel)
    if (findIndex !== -1) {
        itemsInGame.splice(findIndex, 1);
    }
})

const overlayParams = {
    enableDepth: true,
    deleteWhenUnused: false,
    keepNonBlurred: true,
    processAttachments: true,
    fill: { enable: false, color: 0xFFF },
    noise: { enable: false, size: 0.0, speed: 0.0, intensity: 0.0 },
    outline: { enable: true, color: 0x56004f, width: 2.0, blurRadius: 0.0, blurIntensity: 0.0 },
    wireframe: { enable: false }
};
// @ts-ignore
mp.game.graphics.setEntityOverlayPassEnabled(true);
// @ts-ignore
const batch = mp.game.graphics.createEntityOverlayBatch(overlayParams);

let lastRequestTime: number = Date.now();
const requestItem = (item: ObjectMp) => {
    const currentTime = Date.now();
    if (currentTime - lastRequestTime >= 500) {
        lastRequestTime = currentTime;
        callServer("givePlayerItemGame", item);
    }
};

mp.events.add('render', () => {
    if(!itemsInGame.length) return
    itemsInGame.forEach(item => {
        const distance = calculateDistance($localPlayer.position, item.position)
        // Подсветка оружия, если игрок рядом
        if (distance <= 5) {
            // Применяем эффект "Outline"
            batch.addThisFrame(item.object);
        }
        // Если игрок достаточно близко, запрашиваем получение предмета
        if (distance <= 1) {
            requestItem(item.object)
        }
    });
});
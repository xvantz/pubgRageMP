import {createEvent} from "@shared/rpcWrapper";
import {
    $phase,
    $viewZone,
    $zoneMarkerInfo,
    updatePhaseZone,
    updateViewZone,
    updateZoneMarkerInfo
} from "@src/modules/pubg/zone/zoneStore";
import {ZonePubg} from "@shared/types/zonePubg";

createEvent("updateViewZonePubg", (data: ZonePubg) => {
    updateZoneMarkerInfo(data)
    updateViewZone(true)
    createOrUpdateMarker()
})

createEvent("updateZonePubg", (data: ZonePubg) => {
    updateZoneMarkerInfo(data)
})

createEvent("resetViewZonePubg", () => {
    updateViewZone(false)
    updatePhaseZone(0)
})

createEvent("UpdatePhaseZone", (value: number) => {
    updatePhaseZone(value)
})

// Создание или обновление маркера зоны
function createOrUpdateMarker() {
    if ($viewZone) {
        const pos = $zoneMarkerInfo.position;
        mp.game.graphics.drawMarker(
            1, // Тип маркера
            pos.x, pos.y, pos.z - 1, // Позиция маркера
            0, 0, 0, // Направление
            0, 0, 0, // Вращение
            $zoneMarkerInfo.radius*2, $zoneMarkerInfo.radius*2, 1000, // Размер маркера
            255, 0, 0, 100, // Цвет (красный с прозрачностью)
            false, // Визуализировать в 3D
            false, 2, // Визуализация на земле
            false, null, null, false
        );
        mp.game.graphics.drawText(`Фаза: ${$phase}`, [0.9, 0.9], {
            font: 1,
            color: [255, 255, 255, 185],
            scale: [0.9, 0.9],
            outline: false,
            centre: true
        })
    }
}

// Рендер маркера каждый кадр
mp.events.add("render", () => {
    createOrUpdateMarker();
});
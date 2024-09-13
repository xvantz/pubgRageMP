import {ZonePubg} from "@shared/types/zonePubg";

export let $viewZone: boolean = false
export let $zoneMarkerInfo: ZonePubg = {position: new mp.Vector3(121.47, -30.10, 66.5), radius: 10}
export let $phase = 0

export const updateViewZone = (value: boolean) => {
    $viewZone = value
}

export const updateZoneMarkerInfo = (data: ZonePubg) => {
    $zoneMarkerInfo = data
}

export const updatePhaseZone = (value: number) => {
    $phase = value
}
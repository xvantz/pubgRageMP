export const calculateDistance = (pos1: Vector3, pos2: Vector3) => {
    return mp.game.gameplay.getDistanceBetweenCoords(pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z, true);
}
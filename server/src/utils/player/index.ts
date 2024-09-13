
export const setPlayerHP = (player: PlayerMp, hp: number) => {
    if(player && hp >= 0 && hp <= 100){
        player.health = hp
    }
}

export const setPlayerArmour = (player: PlayerMp, armour: number) => {
    if(player && armour >= 0 && armour <= 100){
        player.armour = armour
    }
}

export const setPlayerWeapon = (player: PlayerMp, weaponHash: string | number, ammo: number) => {
    if(player && ammo >= 0 && ammo <= 120) {
        player.giveWeapon(weaponHash, ammo)
    }
}
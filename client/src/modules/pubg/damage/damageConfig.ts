// 20 - кость головы
// 0 - центральная часть тела
// 1 - позвоночник
// 2 - левое бедро
// 14 - правое бедро
// 97 - шея
type DamageListWeapons = {
    weaponHash: number
    boneIndexes: BoneDamage
}

type BoneDamage = {
    [bone: number]: {
        damage: number
    }
}
export const damageListWeapons: DamageListWeapons[] = [
    {
        weaponHash: 736523883, boneIndexes: {
            20: {damage: 30},
            0: {damage: 20},
            1: {damage: 15},
            2: {damage: 10},
            14: {damage: 10},
            97: {damage: 25}
        }
    },
    {weaponHash: 3231910285, boneIndexes: {
            20: {damage: 35},
            0: {damage: 25},
            1: {damage: 20},
            2: {damage: 15},
            14: {damage: 15},
            97: {damage: 30}
        }},
    {weaponHash: 984333226, boneIndexes: {
            20: {damage: 50},
            0: {damage: 40},
            1: {damage: 25},
            2: {damage: 20},
            14: {damage: 20},
            97: {damage: 45}
        }},
    {weaponHash: 205991906, boneIndexes: {
            20: {damage: 60},
            0: {damage: 50},
            1: {damage: 35},
            2: {damage: 30},
            14: {damage: 30},
            97: {damage: 55}
        }},
    {weaponHash: 961495388, boneIndexes: {
            20: {damage: 20},
            0: {damage: 10},
            1: {damage: 10},
            2: {damage: 10},
            14: {damage: 10},
            97: {damage: 25}
        }},
    {weaponHash: 2210333304, boneIndexes: {
            20: {damage: 40},
            0: {damage: 30},
            1: {damage: 25},
            2: {damage: 20},
            14: {damage: 20},
            97: {damage: 35}
        }},
    {weaponHash: 3415619887, boneIndexes: {
            20: {damage: 50},
            0: {damage: 40},
            1: {damage: 35},
            2: {damage: 30},
            14: {damage: 30},
            97: {damage: 45}
        }},
    {weaponHash: 1627465347, boneIndexes: {
            20: {damage: 50},
            0: {damage: 30},
            1: {damage: 35},
            2: {damage: 20},
            14: {damage: 20},
            97: {damage: 45}
        }},
]

export const weaponsModList = [736523883, 3231910285, 984333226, 205991906, 961495388, 2210333304, 3415619887, 1627465347]
export const boneModDamage = [20, 0, 1, 2, 14, 97]

export const countDamagePlayer = (bone: number, weaponHash: number): number => {
    const weapon = damageListWeapons.find((weapon) => weapon.weaponHash === weaponHash)
    const damage = weapon.boneIndexes[bone].damage
    if(damage){
        return damage
    }else{
        return 0
    }
}
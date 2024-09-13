import {boneModDamage, countDamagePlayer, weaponsModList} from "@src/modules/pubg/damage/damageConfig";

mp.events.add("incomingDamage", (_, sourcePlayer, targetEntity, weapon, boneIndex, damage) => {
    if(targetEntity.type === "player" && sourcePlayer) {
        const player = targetEntity as PlayerMp
        if(boneModDamage.includes(boneIndex) && weaponsModList.includes(weapon)) {
            player.applyDamageTo(countDamagePlayer(boneIndex, weapon), true)
            return
        }
        if(damage >= 100 && boneIndex === 20){
            player.applyDamageTo(50, true)
            return;
        }
    }
})
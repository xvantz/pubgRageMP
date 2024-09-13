import {setPosSchema} from "@src/schemas/commandSchemas/posSchema";
import {handleError} from "@src/utils/handleError";
import {callClient} from "@shared/rpcWrapper";

// команда, которая выдает текущие координаты игрока
mp.events.addCommand('getPos', async (player) => {
    const playerPosition = player.position;
    const positionMessage = `Ваши координаты: X: ${playerPosition.x.toFixed(2)}, Y: ${playerPosition.y.toFixed(2)}, Z: ${playerPosition.z.toFixed(2)}`;
    player.outputChatBox(positionMessage);
});

mp.events.addCommand('setPos', (player, command) => {
    try {
        const coord = setPosSchema.parse(command)
        player.spawn(new mp.Vector3(coord[0], coord[1], coord[2]))
    }catch (err){
        handleError(player, err)
    }
})

mp.events.addCommand("createBot", async (player) => {
    mp.peds.new(mp.joaat("a_m_m_skater_01"), player.position, {
        frozen: false,
        invincible: false,
        dimension: player.dimension,
        dynamic: true
    });
})
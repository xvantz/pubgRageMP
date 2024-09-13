export let $livedPlayersCount: number = 0
export let $killedPlayersCount: number = 0

export const updateLivedPlayersCount = (livedPlayersCount: number) => {
    $livedPlayersCount = livedPlayersCount
}

export const updateKilledPlayersCount = (killedPlayersCount: number) => {
    $killedPlayersCount = killedPlayersCount
}
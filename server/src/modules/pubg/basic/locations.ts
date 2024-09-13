export type LocationsGame = {
    name: string,
    minPosition: Vector3,
    maxPosition: Vector3,
}

export const locationsGame: LocationsGame[] = [
    {
        name: "Территория 1",
        minPosition: new mp.Vector3(200, 200, 20),
        maxPosition: new mp.Vector3(300, 300, 30)
    },
    {
        name: "Территория 2",
        minPosition: new mp.Vector3(400, 400, 20),
        maxPosition: new mp.Vector3(500, 500, 30)
    },
    {
        name: "Территория 3",
        minPosition: new mp.Vector3(600, 600, 20),
        maxPosition: new mp.Vector3(700, 700, 30)
    }
];
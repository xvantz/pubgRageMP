export const randomFloatBetween = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
}
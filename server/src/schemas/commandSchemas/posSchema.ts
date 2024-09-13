import {z} from 'zod';

export const setPosSchema = z.string().transform((value) => value.trim().split(' '))
    .refine((arr) => arr.length === 3, 'Для перемещения нужно x y z')
    .refine((arr) => arr.every((val) => !isNaN(Number(val))), 'Все координаты должны быть числами')
    .transform((arr) => arr.map(Number))
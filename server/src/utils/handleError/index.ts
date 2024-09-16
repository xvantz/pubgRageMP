import { z } from 'zod';

// Функция для обработки ошибок
export const handleError = (player: PlayerMp, error: any) => {
    if (error instanceof z.ZodError) {
        // Если ошибка - это ошибка валидации zod
        const validationErrors = error.errors.map(e => e.message);
        sendToPlayerChat(player, validationErrors); // Выводим ошибки в чат игрока
    } else {
        // Если это какая-то другая ошибка
        console.error('Неизвестная ошибка:', error);
    }
}

// Функция для вывода ошибок в чат игрока
const sendToPlayerChat = (player: PlayerMp, messages: any[]) => {
    messages.forEach(message => {
        player.outputChatBox(`${message}`)
    });
}

export function CatchErrors() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            try {
                const result = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    return result.catch((error: Error) => {
                        console.error(`Error in async method ${propertyKey}:`, error);
                        throw error; // Перебрасываем ошибку дальше
                    });
                }
                return result;
            } catch (error) {
                console.error(`Error in sync method ${propertyKey}:`, error);
                throw error; // Перебрасываем ошибку дальше
            }
        };

        return descriptor;
    };
}
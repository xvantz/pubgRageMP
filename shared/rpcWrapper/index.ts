import rpc, {ProcedureListenerInfo} from 'rage-rpc'

export const createEvent = (eventName: string, handler: (args: any, info: ProcedureListenerInfo) => void) => {
    try {
        rpc.register(eventName, (args, info) => {
            try {
                handler(args, info)
            } catch (e) {
                console.error(e)
            }
        })
    } catch (err) {
        console.error(err)
    }
}

export const createEventAsync = <T>(eventName: string, handler: (...args: any[]) => T) => {
    try {
        rpc.register(eventName, async (...args: any[]) => {
            try {
                return await handler(...args);
            } catch (e) {
                console.error(e)
            }
        })
    } catch (err) {
        console.error(err)
    }
}

export const callClient = <T>(player: PlayerMp, eventName: string, args?: T) => {
    rpc.callClient(player, eventName, args)
}

export const callClientAsync = <A, T>(player: PlayerMp, eventName: string, args?: A): Promise<T> => {
    return rpc.callClient(player, eventName, args)
}

export const callServer = <T>(eventName: string, args?: T) => {
    rpc.callServer(eventName, args)
}

export const callServerAsync = <A, T>(eventName: string, args?: A): Promise<T> => {
    return rpc.callServer(eventName, args)
}
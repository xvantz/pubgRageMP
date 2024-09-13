import {createEvent} from "@shared/rpcWrapper";

createEvent("eventHandlerToLog", (message: string, info) => {
    console.log(message)
})
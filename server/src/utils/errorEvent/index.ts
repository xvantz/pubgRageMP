import {createEvent} from "@shared/rpcWrapper";

createEvent("eventHandlerToLog", (message: string, _) => {
    console.log(message)
})
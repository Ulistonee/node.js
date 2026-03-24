import { players } from "../store/store.js";

export const handleRegistration = (ws: WebSocket, msg: any) => {
    const { name, password } = msg;

    if (!name || !password) {
        ws.send(JSON.stringify({ id: 0, error: 'Invalid data' }));
        return;
    }

    if (players.has(name)) {
        ws.send(JSON.stringify({ id: 0, error: 'User already exists' }));
        return;
    }

    players.set(name, {
        name: name,
        index: players.size + 1,
        password: password,
        score: 0
    });

    ws.send(JSON.stringify(
    { 
        type: "reg",
        data: {
            name: name,
            index: players.size,
            error: false,
            errorText: ""
        },
        id: 0
    }));
}
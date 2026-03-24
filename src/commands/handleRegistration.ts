import { players } from "../store/store.js";
import { users } from "../store/store.js";

export const handleRegistration = (ws: WebSocket, msg: any) => {
    const { name, password } = msg;

    if (!name || !password) {
        ws.send(JSON.stringify({ id: 0, error: 'Invalid data' }));
        return;
    }

    if (users.has(name)) {
        const user = users.get(name);

        if (user?.password !== password) {
            ws.send(JSON.stringify({ id: 0, error: 'Invalid password' }));
            return;
        }
        players.set(name, {
            name: name,
            index: user?.index ?? users.size + 1,
            score: 0,
        });
    }
    else {
        users.set(name, {
            name: name,
            index: users.size + 1,
            password: password,
        });
    }

    ws.send(JSON.stringify(
    { 
        type: "reg",
        data: {
            name: name,
            index: users.size,
            error: false,
            errorText: ""
        },
        id: 0
    }));
}
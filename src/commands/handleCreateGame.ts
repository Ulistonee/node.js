import { games } from "../store/store.js";
import { v4 as uuid } from "uuid";

export const handleCreateGame = (ws: WebSocket, msg: any) => {
    const { questions } = msg;

    if (!questions) {
        ws.send(JSON.stringify({ id: 0, error: 'Invalid data' }));
        return;
    }

    const game = {
        id: uuid(),
        questions: questions,
        code: uuid().slice(0, 6)
    }

    games.set(game.id, game);

    ws.send(JSON.stringify(
        { 
            type: "game_created",
            data: {
                gameId: game.id,
                code: game.code
            },
            id: 0 
        })
    );
}
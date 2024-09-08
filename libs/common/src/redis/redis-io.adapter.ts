import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { RedisOptions } from 'ioredis/built/redis/RedisOptions';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;
    private readonly _instanceID: number;
    private _isConnected = {
        PUB: false,
        SUB: false,
    };

    private _lastErrorLogs = {
        PUB: { message: '', timestamp: null },
        SUB: { message: '', timestamp: null },
    };

    constructor(appOrHttpServer: any) {
        super(appOrHttpServer);
        this._instanceID = Math.floor(1_000 + 8999 * Math.random());
    }

    isConnected(client?: 'PUB' | 'SUB') {
        return client ? this._isConnected[client] : this._isConnected.PUB && this._isConnected.SUB;
    }

    async connectToRedis(path: string, options?: RedisOptions): Promise<void> {
        const pubClient = new Redis(path, options);
        const subClient = pubClient.duplicate();

        pubClient.on('error', e => {
            const last = this._lastErrorLogs.PUB;
            const now = new Date().getTime();
            if (last.message === e.message && last.timestamp + 15_000 >= now) {
                return;
            }
            last.message = e.message;
            last.timestamp = now;
            this._lastErrorLogs.PUB = last;
            console.log(`[Pub Client ${this._instanceID}] ${e.message}`);
        });

        subClient.on('error', e => {
            const last = this._lastErrorLogs.SUB;
            const now = new Date().getTime();
            if (last.message === e.message && last.timestamp + 15_000 >= now) {
                return;
            }
            last.message = e.message;
            last.timestamp = now;
            this._lastErrorLogs.SUB = last;
            console.log(`[Sub Client ${this._instanceID}] ${e.message}`);
        });

        this.adapterConstructor = createAdapter(pubClient, subClient);

        this._isConnected.PUB = (await pubClient.ping()) === 'PONG';
        this._isConnected.SUB = (await subClient.ping()) === 'PONG';
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}

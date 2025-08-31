// src/functions/goodbye.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

app.http("goodbye", {
    route: "goodbye",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async (_req: HttpRequest): Promise<HttpResponseInit> => ({
        body: "Bye!"
    })
});

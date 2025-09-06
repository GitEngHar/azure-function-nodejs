// src/functions/hello.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

app.http("hello", {
    route: "hello",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async (_req: HttpRequest): Promise<HttpResponseInit> => ({
        body: "Hello World!!!!!!!!"
    })
});

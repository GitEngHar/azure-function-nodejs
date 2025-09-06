// src/functions/search.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {SearchClient, AzureKeyCredential, SearchIndexClient, KnownSearchFieldDataType} from "@azure/search-documents";

const endpoint = "https://valid-ai-search.search.windows.net";
const key = "deT6cmZGTrin5lIlsWDZPiPagisIf9gTI23UqyCeckAzSeBJPxSc";
const indexName = process.env.INDEX_NAME || "quickidx";

// SearchClient を初期化（シングルトンで再利用）
const indexClient = new SearchIndexClient(endpoint, new AzureKeyCredential(key));
const searchClient = new SearchClient(endpoint, indexName, new AzureKeyCredential(key));

async function ensureIndex(ctx: InvocationContext) {
    try {
        await indexClient.getIndex(indexName);
        ctx.log(`Index '${indexName}' already exists`);
    } catch {
        ctx.log(`Index '${indexName}' not found. Creating...`);
        await indexClient.createIndex({
            name: indexName,
            fields: [
                { name: "id", type: KnownSearchFieldDataType.String, key: true, filterable: true },
                { name: "title", type: KnownSearchFieldDataType.String, searchable: true },
                { name: "category", type: KnownSearchFieldDataType.String, searchable: true, filterable: true},
                { name: "content", type: KnownSearchFieldDataType.String, searchable: true },
            ],
        });
        ctx.log(`Index '${indexName}' created`);

        // 初期データ投入
        await searchClient.uploadDocuments([
            { id: "1", title: "Hello Azure", category: "news", content: "Azure AI Search is great for full-text search." },
            { id: "2", title: "Goodbye Node", category: "blog", content: "Node.js works nicely with Azure SDKs." },
        ]);
        ctx.log("Initial documents uploaded");
    }
}

app.http("search", {
    route: "search",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await ensureIndex(ctx);

            const q = req.query.get("q") || "*";
            const results = await searchClient.search(q, { top: 5, includeTotalCount: true });

            const items: any[] = [];
            for await (const r of results.results) items.push({ score: r.score, ...r.document });

            return {
                status: 200,
                jsonBody: { query: q, count: results.count ?? items.length, items },
            };
        } catch (e: any) {
            ctx.error("Search error", e);
            return {
                status: 500,
                jsonBody: { error: e?.message ?? "unknown error" },
            };
        }
    },
});

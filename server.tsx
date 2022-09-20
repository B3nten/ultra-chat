import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import { createRouter, createServer } from "ultra/server.ts";
import App from "./src/app.tsx";

// Twind
import "./src/twind/twind.ts";

// React Router
import { StaticRouter } from "react-router-dom/server";

// React Query
import { QueryClientProvider } from "@tanstack/react-query";
import { useDehydrateReactQuery } from "./src/react-query/useDehydrateReactQuery.tsx";
import { queryClient } from "./src/react-query/query-client.ts";

const server = await createServer({
  importMapPath: Deno.env.get("ULTRA_MODE") === "development"
    ? import.meta.resolve("./importMap.dev.json")
    : import.meta.resolve("./importMap.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
});

function ServerApp({ context }: any) {
  useDehydrateReactQuery(queryClient);

  const requestUrl = new URL(context.req.url);

  return (
    <QueryClientProvider client={queryClient}>
      <StaticRouter location={new URL(context.req.url).pathname}>
        <App />
      </StaticRouter>
    </QueryClientProvider>
  );
}

server.get("*", async (context) => {
  // clear query cache
  queryClient.clear();

  /**
   * Render the request
   */
  const result = await server.render(<ServerApp context={context} />);

  return context.body(result, 200, {
    "content-type": "text/html; charset=utf-8",
  });
});

if (import.meta.main) {
  serve(server.fetch);
}
export default server;

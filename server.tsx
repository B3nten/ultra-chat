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

import { config as loadEnv } from "https://deno.land/std/dotenv/mod.ts";
const env = await loadEnv({
  export: true,
  allowEmptyValues: true,
});

const server = await createServer({
  importMapPath:
    Deno.env.get("ULTRA_MODE") === "development"
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
/*curl -X GET 'https://api.twitch.tv/helix/users?id=141981764' \
-H 'Authorization: Bearer cfabdegwdoklmawdzdo98xt2fo512y' \
-H 'Client-Id: uo6dggojyb8d6soh92zknwmi5ej1q2'*/
const apiRouter = createRouter();
apiRouter.get("/get-user", async (context) => {
  const token = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${env.CLIENT_ID}&client_secret=${env.CLIENT_SECRET}&grant_type=client_credentials`,
  });
  const res = await token.json();
  const user = await fetch(`https://api.twitch.tv/helix/users?login=xqc`, {
    headers: {
      Authorization: `Bearer ${res.access_token}`,
      "Client-Id": env.CLIENT_ID,
    },
  });
  const data = await user.json();
  console.log(data);
  return context.body(JSON.stringify(data), 200, {
    "content-type": "application/json; charset=utf-8",
  });
});


apiRouter.get("/get-bttv-emotes", async (context) => {
  console.log(context)
  const name = new URL(context.req.url).searchParams.get('name')
  const token = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${env.CLIENT_ID}&client_secret=${env.CLIENT_SECRET}&grant_type=client_credentials`,
  });
  const res = await token.json();
  const user = await fetch(`https://api.twitch.tv/helix/users?login=${name}`, {
    headers: {
      Authorization: `Bearer ${res.access_token}`,
      "Client-Id": env.CLIENT_ID,
    },
  });
  const userData = await user.json();
  const userID = userData.data[0].id;
  if (!userID)
    return context.body(JSON.stringify({ error: "No user found" }), 200);
  const bttv = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userID}`);
  const bttvData = await bttv.json();
  return context.body(JSON.stringify(bttvData), 200, {
    "content-type": "application/json; charset=utf-8",
  });
});
server.route("/api", apiRouter);

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

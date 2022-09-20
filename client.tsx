import { hydrateRoot } from "react-dom/client";
import App from "./src/app.tsx";

// Twind
import "./src/twind/twind.ts";

// React Router
import { BrowserRouter } from "react-router-dom";

// React Query
import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/react-query/query-client.ts";
declare const __REACT_QUERY_DEHYDRATED_STATE: unknown;

function ClientApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={__REACT_QUERY_DEHYDRATED_STATE}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Hydrate>
    </QueryClientProvider>
  );
}

hydrateRoot(document, <ClientApp />);

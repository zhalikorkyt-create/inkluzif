import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { StoreProvider } from "./lib/store";
import "./styles.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </StrictMode>,
);

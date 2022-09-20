// Twind
import { TwindProvider } from "./twind/TwindProvider.tsx";
// React Router
import { Routes, Route } from "react-router-dom";
// Routes
import Channel from "./routes/Channel.tsx";

export default function App() {
  console.log("Hello world!");
  return (
    <TwindProvider>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Ultra Chat</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="stylesheet" href="/style.css" />
        </head>
        <body>
          <main>
           <Routes>
              <Route path="/" element={<div>home</div>} />
              <Route path=":channel" element={<Channel />} />
           </Routes>
          </main>
        </body>
      </html>
    </TwindProvider>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Connect from "./pages/Connect";
import Inbox from "./pages/Inbox";
import Send from "./pages/Send";
import Settings from "./pages/Settings";
import Upgrade from "./pages/Upgrade";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/send" element={<Send />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;

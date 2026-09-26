import { useApp } from "./context/AppContext";
import Nav from "./components/Nav";
import ScanPage from "./pages/ScanPage";
import SwapPage from "./pages/SwapPage";
import SimulatePage from "./pages/SimulatePage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

const PAGES = { scan: ScanPage, swap: SwapPage, sim: SimulatePage, map: MapPage, me: ProfilePage };

export default function App() {
  const { tab } = useApp();
  const Page = PAGES[tab];
  return (
    <>
      <header className="header">
        <h1>Carbon<span>Cart</span></h1>
        <p className="tag">Not what to buy — the consequences of your choices.</p>
      </header>
      <main className="main">
        <Page />
      </main>
      <Nav />
    </>
  );
}

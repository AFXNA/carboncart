import { useApp } from "./context/AppContext";
import Globe from "./components/Globe";
import Safe from "./components/Safe";
import Nav from "./components/Nav";
import ScanPage from "./pages/ScanPage";
import SwapPage from "./pages/SwapPage";
import ChatPage from "./pages/ChatPage";
import MapPage from "./pages/MapPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";

const PAGES = { scan: ScanPage, swap: SwapPage, chat: ChatPage, map: MapPage, me: ProfilePage };

export default function App() {
  const { tab, user } = useApp();
  const Page = PAGES[tab];
  return (
    <>
      <header className="hero">
        <div className="hero-globe"><Safe fallback={<div style={{ height: 40 }} />}><Globe height={260} label="Rotating Earth" /></Safe></div>
        <div className="hero-text">
          <h1>Carbon<span>Cart</span></h1>
          <p>Not what to buy — the consequences of your choices.</p>
        </div>
      </header>
      <main className="main">
        <Safe>{user ? <Page key={tab} /> : <AuthPage />}</Safe>
      </main>
      {user && <Nav />}
    </>
  );
}

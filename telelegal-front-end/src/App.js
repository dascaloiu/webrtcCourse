import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import socketConnection from "./webRTCutilities/socketConnection.js";
import MainVideoPage from "./videoComponents/MainVideoPage.js";
import ProDashboard from "./siteComponents/ProDashboard.js";
import ProMainVideoPage from "./videoComponents/ProMainVideoPage.js";

const Home = () => <h1>Hello, Home page</h1>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" Component={Home} />
        <Route path="/join-video" Component={MainVideoPage} />
        <Route exact path="/dashboard" Component={ProDashboard} />
        <Route exact path="/join-video-pro" Component={ProMainVideoPage} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

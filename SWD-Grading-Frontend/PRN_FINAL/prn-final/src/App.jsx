import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPoint from "./Page/MainPoint/MainPoint";
import Login from "./Page/Login/Login";
import Register from "./Page/Register/Register";
import PointTurn from "./Page/PointTurn/PointTurn";
import PointList from "./Page/PointList/PointList";
import PointTurnDetail from "./Page/PointTurnDetail/PointTurnDetail";
import ListStudent from "./Page/ListStudent/ListStudent";
import PlagiarismDetail from "./Page/PlagiarismDetail/PlagiarismDetail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/point-list" element={<PointList />} />
        <Route path="/point-turn" element={<PointTurn />} />
        <Route path="/point-turn-detail" element={<PointTurnDetail />} />
        <Route path="/list-student" element={<ListStudent />} />
        <Route path="/main-point" element={<MainPoint />} />
        <Route path="/plagiarism-detail" element={<PlagiarismDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { PatientProvider } from "./contexts/PatientContext.jsx";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import InstallPWA from "./components/InstallPWA.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PatientProvider>
          <AppRoutes />
          <InstallPWA />
        </PatientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

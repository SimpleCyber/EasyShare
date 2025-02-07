import React, { useEffect, useState } from "react";
import axios from "axios";
import reportWebVitals from './reportWebVitals';
import ShareItNow from "./Components/home";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // axios.get("http://localhost:5000/")
    axios.get("https://shareitnow-6zno.onrender.com/")
      .then((response) => setData(response.data.message))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
      <ShareItNow />
    </div>
  );
}

reportWebVitals();


export default App;

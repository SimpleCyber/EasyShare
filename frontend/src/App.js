import React, { useEffect, useState } from "react";
import axios from "axios";
import reportWebVitals from './reportWebVitals';

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
      <h1>React Frontend</h1>
      <p>{data ? data : "Loading..."}</p>
    </div>
  );
}

reportWebVitals();


export default App;

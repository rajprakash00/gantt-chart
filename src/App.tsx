import React, { useEffect, useState } from "react";
import "./App.css";
import GanttChart, { Sprint } from "./components/GanttChart";
function App() {
  const [sprintData, setSprintData] = useState<Sprint[]>();
  useEffect(() => {
    fetch("https://gcp-mock.apiwiz.io/v1/sprints", {
      method: "GET",
      headers: {
        "x-tenant": "b4349714-47c7-4605-a81c-df509fc7e653",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setSprintData(data);
      });
  }, []);
  return (
    <div className="App h-full">
      {sprintData?.length && <GanttChart data={sprintData} />}
    </div>
  );
}

export default App;

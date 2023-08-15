import React, { useCallback, useEffect, useState } from "react";
import { Chart, ReactGoogleChartEvent } from "react-google-charts";

export interface Task {
  id: number;
  name: string;
  summary: string;
  assignee: string;
  startDate: string;
  endDate: string;
  type: string;
  priority: string;
  status: string;
  effortSpent: number;
}

export interface Milestone {
  milestoneName: string;
  milestoneSummary: string;
  assignee: string;
  startDate: string;
  endDate: string;
  tasks: Task[];
}

export interface Sprint {
  sprintName: string;
  sprintSummary: string;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

interface GanttChartProps {
  data: Sprint[];
}

const GanttChart = ({ data }: GanttChartProps) => {
  const [expandedSprints, setExpandedSprints] = useState<string[]>([]);
  const [chartData, setChartData] = useState<{ [k: string]: any }>([]);
  const [selectedSprints, setSelectedSprints] = useState<string[]>([]);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);

  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);

  const CHART_COLUMNS = [
    { type: "string", label: "Task ID" },
    { type: "string", label: "Task Name" },
    { type: "string", label: "Resource" },
    { type: "date", label: "Start Date" },
    { type: "date", label: "End Date" },
    { type: "number", label: "Duration" },
    { type: "number", label: "Percent Complete" },
    { type: "string", label: "Dependencies" },
  ];

  const getChartData = (data: Sprint[]) =>
    data.reduce((acc, sprint, index) => {
      const sprintId = sprint.sprintName + "/" + index;
      acc = {
        ...acc,
        [sprintId]: {
          data: [],
          milestones: {},
        },
      };
      // milestoneData
      let totalMilestoneCompletionPercent = 0;
      const milestones = sprint.milestones.map((milestone, index1) => {
        const milestoneId =
          sprint.sprintName +
          "/" +
          index +
          "/" +
          milestone.milestoneName +
          "/" +
          index1;
        acc[sprintId] = {
          ...acc[sprintId],
          milestones: {
            ...acc[sprintId]["milestones"],
            [milestoneId]: {
              data: [],
              tasks: [],
            },
          },
        };
        const totalTasks = milestone.tasks.length;
        const completedTasks = milestone.tasks.map(
          (task) => task.status === "Done"
        ).length;
        const milestoneCompletion =
          Math.floor(completedTasks / totalTasks) * 100;

        totalMilestoneCompletionPercent += milestoneCompletion;
        const milestoneTasks = milestone.tasks.map((task) => {
          const taskId =
            sprint.sprintName +
            "/" +
            index +
            "/" +
            milestone.milestoneName +
            "/" +
            index1 +
            "/" +
            task.name;
          return [
            taskId,
            task.name,
            `${task.type} Task`,
            new Date(task.startDate),
            new Date(task.endDate),
            null,
            task.status === "Done" ? 100 : 0,
            null,
          ];
        });
        acc[sprintId]["milestones"][milestoneId]["tasks"] = milestoneTasks;

        acc[sprintId]["milestones"][milestoneId]["data"] = [
          milestoneId,
          milestone.milestoneName,
          "Milestone",
          new Date(milestone.startDate),
          new Date(milestone.endDate),
          null,
          milestoneCompletion,
          sprintId,
        ];

        return [
          milestoneId,
          milestone.milestoneName,
          null,
          new Date(milestone.startDate),
          new Date(milestone.endDate),
          null,
          milestoneCompletion,
          expandedSprints.includes(sprint.sprintName)
            ? sprint.sprintName
            : null,
        ];
      });
      acc[sprintId]["data"] = [
        sprintId,
        sprint.sprintName,
        "Sprint",
        new Date(sprint.startDate),
        new Date(sprint.endDate),
        null,
        Math.floor(totalMilestoneCompletionPercent / milestones.length) * 100,
        null,
      ];

      return acc;
    }, {} as { [k: string]: any });

  const getDataTable = () => {
    return Object.entries(chartData).flatMap(([sprintId, sprintData]) => {
      const result: any[] = [sprintData.data];
      if (selectedSprints.some((id) => id.startsWith(sprintId))) {
        const milestoneDataResults: any[] = [];
        Object.entries(sprintData.milestones).forEach(
          ([milestoneId, milestoneData]: any[]) => {
            milestoneDataResults.push(milestoneData.data);
            if (selectedMilestones.some((id) => id.startsWith(milestoneId))) {
              milestoneDataResults.push(...milestoneData.tasks);
            }
          }
        );
        result.push(...milestoneDataResults);
      }
      return result;
    });
  };

  useEffect(() => {
    setChartData(getChartData(data));
  }, [data]);

  const getChartEvents = () => {
    return [
      {
        eventName: "select",
        callback: ({ chartWrapper }) => {
          let selectedRowIndex = chartWrapper
            .getChart()
            .getSelection()?.[0]?.row;

          const tableData = getDataTable();
          const selectedTableRow = tableData[selectedRowIndex][0];
          const selectedTableRowType = selectedTableRow.split("/").length;

          if (selectedTableRowType === 2) {
            if (selectedSprints.includes(selectedTableRow)) {
              setSelectedSprints((prevSprint) => {
                const newSelectedSprints = [...prevSprint];
                newSelectedSprints.splice(selectedTableRow, 1);
                return newSelectedSprints;
              });
              setSelectedMilestones((prevMilestone) =>
                prevMilestone.filter(
                  (item) => !item.startsWith(selectedTableRow)
                )
              );
            } else {
              setSelectedSprints((prevSprint) => [
                ...prevSprint,
                selectedTableRow,
              ]);
            }
          } else if (selectedTableRowType === 4) {
            if (selectedMilestones.includes(selectedTableRow)) {
              setSelectedMilestones((prevMilestone) => {
                const newSelectedMilestone = [...prevMilestone];
                newSelectedMilestone.splice(selectedTableRow, 1);
                return newSelectedMilestone;
              });
            } else {
              setSelectedMilestones((prevMilestone) => [
                ...prevMilestone,
                selectedTableRow,
              ]);
            }
          }
        },
      },
    ] as ReactGoogleChartEvent[];
  };

  return (
    <div className="p-4 h-full">
      <Chart
        width={"100%"}
        height={"100%"}
        chartType="Gantt"
        loader={<div>Loading Chart</div>}
        data={[CHART_COLUMNS, ...getDataTable()]}
        chartEvents={getChartEvents()}
        options={{
          height: 2800,
        }}
        rootProps={{ "data-testid": "1" }}
      />
    </div>
  );
};

export default GanttChart;

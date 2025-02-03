import React, { useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Button,
  Paper,
  Divider,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";

const inspectionAreas = [
  { id: 1, label: "Protocol Deviation" },
  { id: 2, label: "Adverse Events" },
  { id: 3, label: "Severe Adverse Events" },
  { id: 4, label: "Data Integrity" },
  { id: 5, label: "Patient Consent" },
  { id: 6, label: "Regulatory Compliance" },
  { id: 7, label: "Documentation Review" },
  { id: 8, label: "Site Monitoring" },
];

const activities = [
  {
    id: 1,
    inspectionAreaId: 1,
    label: "Activity 1",
    agents: [
      {
        id: 1,
        name: "Agent A",
        message: "Reviewing protocol deviations...",
        status: "completed",
        output: "No major deviations found.",
      },
      {
        id: 2,
        name: "Agent B",
        message: "Validating data...",
        status: "in-progress",
        output: "Data validation is 80% complete.",
      },
    ],
  },
  {
    id: 2,
    inspectionAreaId: 1,
    label: "Activity 2",
    agents: [
      {
        id: 3,
        name: "Agent C",
        message: "Generating report...",
        status: "pending",
        output: "Report generation is queued.",
      },
    ],
  },
];

function App() {
  const [activeInspectionArea, setActiveInspectionArea] = useState(1);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [selectedAgentOutput, setSelectedAgentOutput] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleInspectionAreaClick = (areaId) => {
    setActiveInspectionArea(areaId);
    setExpandedActivity(null); // Collapse all activities when switching areas
    setSelectedAgentOutput(null); // Clear output pane
  };

  const handleActivityClick = (activityId) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
    setSelectedAgentOutput(null); // Clear output pane when switching activities
  };

  const handleAgentClick = (agent) => {
    setSelectedAgentOutput(agent.output);
  };

  const filteredActivities = activities.filter(
    (activity) => activity.inspectionAreaId === activeInspectionArea
  );

  const filteredInspectionAreas = inspectionAreas.filter((area) =>
    area.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh", padding: "20px", gap: "20px" }}>
      {/* Left Pane: Chat Window */}
      <Paper elevation={3} style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {/* Search Bar */}
        <TextField
          label="Search Inspection Areas"
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: "20px" }}
        />

        {/* Vertical Stepper for Inspection Areas */}
        <Box style={{ maxHeight: "400px", overflowY: "auto" }}>
          <Stepper orientation="vertical" activeStep={activeInspectionArea - 1}>
            {filteredInspectionAreas.map((area) => (
              <Step key={area.id} onClick={() => handleInspectionAreaClick(area.id)}>
                <StepLabel>
                  <Typography>{area.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Mid-Level: Activities */}
        <div style={{ marginTop: "20px" }}>
          {filteredActivities.map((activity) => (
            <Accordion
              key={activity.id}
              expanded={expandedActivity === activity.id}
              onChange={() => handleActivityClick(activity.id)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{activity.label}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Agent-Level: Messages */}
                <List>
                  {activity.agents.map((agent) => (
                    <ListItem
                      key={agent.id}
                      button
                      onClick={() => handleAgentClick(agent)}
                    >
                      <ListItemAvatar>
                        <Avatar>{agent.name[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={agent.message}
                        secondary={`Status: ${agent.status}`}
                      />
                      {agent.status === "completed" && <CheckCircleIcon color="success" />}
                      {agent.status === "in-progress" && <PendingIcon color="warning" />}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </Paper>

      {/* Right Pane: Output Results */}
      <Paper elevation={3} style={{ flex: 1, padding: "20px" }}>
        <Typography variant="h6" gutterBottom>
          Output Pane
        </Typography>
        <Divider style={{ marginBottom: "20px" }} />
        {selectedAgentOutput ? (
          <Typography>{selectedAgentOutput}</Typography>
        ) : (
          <Typography color="textSecondary">Select an agent to view output.</Typography>
        )}
      </Paper>
    </div>
  );
}

export default App;
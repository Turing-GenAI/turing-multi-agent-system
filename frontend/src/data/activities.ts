export interface TreeNode {
  name: string;
  summary?: string;
  content?: string;
  children?: TreeNode[];
  fullPath?: string;
  hasChildren?: boolean;
}

export interface PathNode {
  title: string;
  color: string;
}

export interface FlatNode extends TreeNode {
  fullPath: string;
  hasChildren: boolean;
}

export const activities: TreeNode[] = [
  {
    "name": "Protocol deviation",
    "children": [
      {
        "name": "Activity ID 1",
        "children": [
          {
            "name": "Inspection Master",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "name": "Planner Agent",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "name": "Critique agent",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "name": "Feedback agent",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          }
        ]
      },
      {
        "name": "Activity ID 2",
        "children": [
          {
            "name": "Inspection Master",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "name": "Planner Agent",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "name": "Critique agent",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "name": "Feedback agent",
            "children": [
              {
                "name": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "name": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          }
        ]
      }
    ]
  }
];

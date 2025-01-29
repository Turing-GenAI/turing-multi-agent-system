export interface TreeNode {
  title: string;
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
    "title": "Protocol deviation",
    "children": [
      {
        "title": "Activity ID 1",
        "children": [
          {
            "title": "Inspection Master",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "title": "Planner Agent",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "title": "Critique agent",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "title": "Feedback agent",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          }
        ]
      },
      {
        "title": "Activity ID 2",
        "children": [
          {
            "title": "Inspection Master",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "title": "Planner Agent",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "title": "Critique agent",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
                "summary": "Sub-activities were revised to accommodate stakeholder feedback and ensure better alignment with project goals. Additional resources were allocated to address high-risk areas. Timelines have also been updated accordingly.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              }
            ]
          },
          {
            "title": "Feedback agent",
            "children": [
              {
                "title": "Planned sub-activities",
                "summary": "All sub-activities have been thoroughly planned, including resource allocation and scheduling. We have accounted for potential risks and set realistic milestones. Final approval from the QA team is pending.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Recommendation on the plan",
                "summary": "Recommendations focus on optimizing resource usage and ensuring timely delivery. We have also introduced iterative checkpoints for quality checks. Further improvements may result from ongoing feedback.",
                "content": "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created with following milestones:\n   - Requirements gathering: 2 days\n   - Design phase: 3 days\n   - Implementation: 5 days\n   - Testing: 2 days\n4. Risk assessment completed\n5. Budget allocated"
              },
              {
                "title": "Reworked sub-activities",
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

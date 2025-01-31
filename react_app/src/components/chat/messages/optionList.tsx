// Inside OptionList Component

interface OptionListProps {
  conversationId: string;
  handleOptionSelect: (
    label: string,
    chat_id: string,
    type: string,
    subCase: string
  ) => void;
  handleSubCase: (label: string) => void;
  selectedSubCase: string | undefined; // Accept the state as a prop
}

const OptionList: React.FC<OptionListProps> = ({
  conversationId,
  handleOptionSelect,
  handleSubCase,
  selectedSubCase,
}) => {
  const handleSelection = (subCase: string, quest: string) => {
    handleSubCase(subCase);
    handleOptionSelect(quest, conversationId, "left", subCase);
  };

  return (
    <>
      <div className="message-wrap left">
        <div className="d-flex flex-column">
          <div className="card">
            <div className="card-body">
              <div className="d-flex msg-user-info">
                <p className="card-text nignt">
                  <i className="bi bi-chat-dots pe-2"></i>Choose Your Path
                </p>
              </div>
            </div>
          </div>
          <small className="text-muted datetime">12:58 PM</small>
        </div>
      </div>
      <ul className="list-group checklist">
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="radio"
            name="listGroupRadio"
            id="firstRadio"
            checked={selectedSubCase === "a"} // Check against the state
            onChange={() => handleSelection("a", `I would like a guided tour`)}
            disabled={
              selectedSubCase !== undefined &&
              selectedSubCase !== "" &&
              selectedSubCase !== "a"
            }
          />
          <label className="form-check-label" htmlFor="firstRadio">
            I would would like a tour of procurement wizard.
          </label>
        </li>
        <li className="list-group-item">
          <input
            className="form-check-input me-1"
            type="radio"
            name="listGroupRadio"
            id="secondRadio"
            checked={selectedSubCase === "b"} // Check against the state
            onChange={() => handleSelection("b", `I know exactly what I want`)}
            disabled={
              selectedSubCase !== undefined &&
              selectedSubCase !== "" &&
              selectedSubCase !== "b"
            }
          />
          <label className="form-check-label" htmlFor="secondRadio">
            I know exactly what I want
          </label>
        </li>
      </ul>
    </>
  );
};

export default OptionList;
